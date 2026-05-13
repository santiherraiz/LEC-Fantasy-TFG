import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { JugadorDetalleDTO, JugadorEstadistica } from '../types';

export const useJugadorDetalle = (id: string | string[] | undefined) => {
  const { selectedLigaId, user } = useAuthStore();
  const [jugador, setJugador] = useState<JugadorDetalleDTO | null>(null);
  const [estadisticas, setEstadisticas] = useState<JugadorEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxWeek, setMaxWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'PARTIDOS' | 'STATS'>('RESUMEN');
  const [selectedMapIndex, setSelectedMapIndex] = useState<Record<string, number>>({});
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const [jugadorRes, statsRes, semanaRes] = await Promise.all([
        api.get(`/jugadores/${id}`, { params: { ligaId: selectedLigaId } }),
        api.get(`/jugadores/${id}/estadisticas`),
        api.get('/liga/semana-actual')
      ]);
      setJugador(jugadorRes.data);
      setEstadisticas(statsRes.data);
      const currentWeek = semanaRes.data || 1;
      setMaxWeek(currentWeek > 90 ? currentWeek - 90 : currentWeek);
    } catch (error) {
      console.error("Error cargando detalle:", error);
    } finally {
      setLoading(false);
    }
  }, [id, selectedLigaId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleClausulazo = async () => {
    if (!jugador || isProcessing) return;

    const precio = Math.round((jugador.precioActual || jugador.precioBase) * 1.5);

    Alert.alert(
      "💣 CLAUSULAZO",
      `¿Quieres robar a ${jugador.nickname} pagando su cláusula de ${precio.toLocaleString()} €?\n\n(150% de su valor actual)`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "¡ROBAR!",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const res = await api.post('/mercado/clausulazo', {
                ligaId: selectedLigaId,
                jugadorId: jugador.id,
                usuarioId: user?.id
              });

              Alert.alert("✅ ÉXITO", res.data.message || `${jugador.nickname} ahora forma parte de tu equipo.`);
              fetchDetail();
            } catch (error: any) {
              const errorMsg = error.response?.data?.message || error.response?.data || "No se pudo ejecutar el clausulazo";
              Alert.alert("❌ ERROR", errorMsg);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const selectMap = (serieId: string, index: number) => {
    setSelectedMapIndex(prev => ({ ...prev, [serieId]: index }));
  };

  const toggleSerie = (serieId: string) => {
    setExpandedSeries(prev => ({ ...prev, [serieId]: !prev[serieId] }));
  };

  const computedStats = useMemo(() => {
    const grouped: Record<number, Record<string, JugadorEstadistica[]>> = {};

    // Filtramos estadísticas que no tengan datos de equipos válidos para evitar el "vs Rival"
    const validEstadisticas = estadisticas.filter(stat => stat.team1 && stat.team2);

    validEstadisticas.forEach(stat => {
      let w = stat.semana || 1;
      if (w > 90) w -= 90;
      const s = stat.serieId || `GAME_${stat.gameId}`;
      if (!grouped[w]) grouped[w] = {};
      if (!grouped[w][s]) grouped[w][s] = [];
      grouped[w][s].push(stat);
    });

    Object.values(grouped).forEach(week => {
      Object.values(week).forEach(maps => {
        maps.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      });
    });

    const statsWeeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const wAsc = statsWeeks;
    const wDesc = statsWeeks.slice().sort((a, b) => b - a);

    const wData = wAsc.map(w => {
      const weekMatches = grouped[w];
      if (!weekMatches) return { value: 0, played: false };

      const seriesSums = Object.values(weekMatches).map(maps => {
        return maps.reduce((acc, m) => acc + m.puntosGenerados, 0);
      });
      const totalWeek = seriesSums.reduce((acc, p) => acc + p, 0) / (seriesSums.length || 1);
      return { value: Math.round(totalWeek), played: true };
    });

    const playedWeeksData = wData.filter(d => d.played);
    const avgPointsPerWeek = playedWeeksData.length > 0
      ? (playedWeeksData.reduce((acc, d) => acc + d.value, 0) / playedWeeksData.length).toFixed(0)
      : "0";

    const summary = {
      kda: (estadisticas.reduce((acc, s) => acc + (s.kills + s.assists) / (s.deaths || 1), 0) / (estadisticas.length || 1)).toFixed(2),
      csMin: (estadisticas.reduce((acc, s) => acc + s.cs, 0) / (estadisticas.length * 30 || 1)).toFixed(1),
      avgPoints: avgPointsPerWeek,
      damage: 18500,
      mitigated: 12200,
      vision: 1.4
    };

    const avgKills = (estadisticas.reduce((acc, s) => acc + s.kills, 0) / (estadisticas.length || 1));
    const avgDeaths = (estadisticas.reduce((acc, s) => acc + s.deaths, 0) / (estadisticas.length || 1));
    const avgAssists = (estadisticas.reduce((acc, s) => acc + s.assists, 0) / (estadisticas.length || 1));

    const killsVal = Math.min(avgKills * 10, 100);
    const deathsVal = Math.max(0, 100 - (avgDeaths * 15));
    const assistsVal = Math.min(avgAssists * 8, 100);
    const csmVal = Math.min(parseFloat(summary.csMin) * 10, 100);
    const ptsVal = Math.min(parseFloat(summary.avgPoints) * 2, 100);

    return { 
      groupedStats: grouped, 
      weeklyData: wData, 
      statsSummary: summary, 
      allWeeksAsc: wAsc, 
      allWeeks: wDesc,
      radarData: [killsVal, deathsVal, assistsVal, csmVal, ptsVal]
    };
  }, [estadisticas]);

  return {
    user,
    jugador,
    estadisticas,
    loading,
    maxWeek,
    isProcessing,
    activeTab,
    setActiveTab,
    selectedMapIndex,
    expandedSeries,
    ...computedStats,
    handleClausulazo,
    selectMap,
    toggleSerie
  };
};
