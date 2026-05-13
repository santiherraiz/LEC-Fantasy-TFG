import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../api/api';
import { RankingEntry, Jornada } from '../types';
import { useAuthStore } from '../store/authStore';

export const useRanking = () => {
  const { user, selectedLigaId } = useAuthStore();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // El ID activo se deriva de los parámetros de la URL o se mantiene null (Global)
  const jornadaParam = params.jornadaId as string | undefined;
  const activeId = (jornadaParam === 'null' || !jornadaParam) ? null : parseInt(jornadaParam, 10);

  // 1. Efecto de seguridad para asegurar que el contexto de navegación está listo
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const fetchJornadas = useCallback(async () => {
    if (!selectedLigaId) return;
    try {
      const res = await api.get('/jornadas');
      const data = Array.isArray(res.data) ? res.data : [];
      const validJornadas = data
        .filter((j: any) => j && j.estado !== 'PROGRAMADA')
        .sort((a: any, b: any) => a.numeroSemana - b.numeroSemana);
      setJornadas(validJornadas);
    } catch (e) {
      console.error("Error al cargar jornadas:", e);
      setJornadas([]);
    }
  }, [selectedLigaId]);

  const fetchRanking = useCallback(async (jId: number | null) => {
    if (!selectedLigaId) return;
    setLoading(true);
    try {
      const res = await api.get('/equipos/ranking', {
        params: { ligaId: selectedLigaId, jornadaId: jId }
      });
      setRanking(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error al cargar ranking:", e);
      setRanking([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLigaId]);

  // Lógica de inicialización
  useEffect(() => {
    if (!isReady || !selectedLigaId) return;

    fetchJornadas();

    // Si entramos sin parámetro, buscamos la jornada actual
    if (jornadaParam === undefined) {
      api.get('/jornadas/actual').then(res => {
        const actual = res.data;
        if (actual && ['BLOQUEADA', 'PROCESANDO', 'FINALIZADA'].includes(actual.estado)) {
          fetchRanking(actual.id);
        } else {
          fetchRanking(null);
        }
      }).catch(() => fetchRanking(null));
    } else {
      fetchRanking(activeId);
    }
  }, [isReady, selectedLigaId, jornadaParam, activeId, fetchJornadas, fetchRanking]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJornadas();
    fetchRanking(activeId);
  }, [activeId, fetchJornadas, fetchRanking]);

  const handleWeekSelect = (idStr: string) => {
    try {
      router.setParams({ jornadaId: idStr });
    } catch (e) {
      console.warn("Error al actualizar parámetros:", e);
    }
  };

  const navigateToDetail = (entry: RankingEntry) => {
    const isOwnTeam = entry.nombreUsuario === user?.nickname;
    if (activeId !== null) {
      // En ranking semanal, detalle de esa jornada
      router.push({
        pathname: `/(main)/equipo-jornada/${entry.equipoId}` as any,
        params: { jornadaId: activeId.toString() }
      });
    } else {
      // En ranking global
      if (isOwnTeam) {
        router.push(`/(main)/equipo-jornada/${entry.equipoId}`);
      } else {
        router.push(`/(main)/rival/${entry.equipoId}`);
      }
    }
  };

  return {
    user,
    jornadas,
    ranking,
    loading,
    refreshing,
    isReady,
    activeId,
    onRefresh,
    handleWeekSelect,
    navigateToDetail
  };
};
