import React, { useEffect, useState, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Svg, Polyline, Circle, Line, Polygon, G, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import api from '../../../src/api/api';
import { JugadorDetalleDTO, JugadorEstadistica } from '../../../src/types';
import { useAuthStore } from '../../../src/store/authStore';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Swords,
  TrendingUp,
  Activity,
  Skull,
  Users,
  Wheat,
  Zap,
  Shield,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function JugadorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { selectedLigaId, user } = useAuthStore();

  const [jugador, setJugador] = useState<JugadorDetalleDTO | null>(null);
  const [estadisticas, setEstadisticas] = useState<JugadorEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxWeek, setMaxWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'PARTIDOS' | 'STATS'>('RESUMEN');
  const [selectedMapIndex, setSelectedMapIndex] = useState<Record<string, number>>({});
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
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
    };
    fetchDetail();
  }, [id, selectedLigaId]);

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
              await api.post('/mercado/clausulazo', {
                ligaId: selectedLigaId,
                jugadorId: jugador.id
              });

              Alert.alert("✅ ÉXITO", `${jugador.nickname} ahora forma parte de tu equipo.`);

              // Recargar datos
              const jugadorRes = await api.get(`/jugadores/${id}`, { params: { ligaId: selectedLigaId } });
              setJugador(jugadorRes.data);
            } catch (error: any) {
              Alert.alert("❌ ERROR", error.response?.data || "No se pudo ejecutar el clausulazo");
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

  // Memoizamos todos los cálculos pesados para evitar lag al cambiar de pestaña
  const { groupedStats, weeklyData, statsSummary, allWeeksAsc, allWeeks } = useMemo(() => {
    const grouped: Record<number, Record<string, JugadorEstadistica[]>> = {};

    estadisticas.forEach(stat => {
      let w = stat.semana || 1;
      if (w > 90) w -= 90;
      const s = stat.serieId || `GAME_${stat.gameId}`;
      if (!grouped[w]) grouped[w] = {};
      if (!grouped[w][s]) grouped[w][s] = [];
      grouped[w][s].push(stat);
    });

    // Ordenar los mapas dentro de cada serie por fecha (Ascendente: Mapa 1, Mapa 2...)
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

    return { groupedStats: grouped, weeklyData: wData, statsSummary: summary, allWeeksAsc: wAsc, allWeeks: wDesc };
  }, [estadisticas]);

  if (loading) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!jugador) return null;

  const radarPoints = [85, 70, 90, 65, 55, 75];
  const avgRadarPoints = [60, 65, 50, 55, 60, 50];

  const esPropietario = jugador.propietarioNickname === user?.nickname;

  return (
    <View className="flex-1 bg-midnight">
      {/* Header Fijo */}
      <View className="px-4 pt-14 pb-4 flex-row items-center border-b border-surface-light/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2.5 bg-surface rounded-xl border border-surface-light/50">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1 ml-4 flex-row items-center">
          {jugador.equipoLecLogo && (
            <View className="w-10 h-10 bg-surface rounded-lg items-center justify-center mr-3 border border-surface-light/20">
              <Image source={{ uri: jugador.equipoLecLogo }} className="w-7 h-7" resizeMode="contain" />
            </View>
          )}
          <View>
            <Text className="text-white text-lg font-black italic uppercase">{jugador.nickname}</Text>
            <Text className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">
              {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol} • {jugador.equipoLecNombre || 'AGENTE LIBRE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Navegación de Pestañas */}
      <View className="flex-row px-4 border-b border-surface-light/20">
        {(['RESUMEN', 'PARTIDOS', 'STATS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`py-4 mr-6 border-b-2 ${activeTab === tab ? 'border-accent-cyan' : 'border-transparent'}`}
          >
            <Text className={`text-xs font-black uppercase tracking-widest ${activeTab === tab ? 'text-accent-cyan' : 'text-gray-500'}`}>
              {tab === 'STATS' ? 'ESTADÍSTICAS' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* TAB: RESUMEN */}
        {activeTab === 'RESUMEN' && (
          <View className="p-4">
            {/* Tarjeta Principal */}
            <View className="py-8 bg-surface rounded-[32px] border border-surface-light/30 shadow-sm mt-2 overflow-hidden relative">
              {/* Logo de equipo de fondo - Watermark */}
              {jugador.equipoLecLogo && (
                <Image
                  source={{ uri: jugador.equipoLecLogo }}
                  className="w-64 h-64 absolute -right-4 top-10 opacity-[0.18]"
                  style={{ transform: [{ rotate: '10deg' }] }}
                  resizeMode="contain"
                />
              )}
              <View className="flex-row px-6 items-center pt-4">
                <View className="w-32 h-32 bg-midnight/50 rounded-[32px] items-center justify-center border border-surface-light/40 overflow-hidden relative">
                  {jugador.imagenUrl ? (
                    <>
                      <Image
                        source={{ uri: jugador.imagenUrl }}
                        className="w-32 h-32"
                        style={{ marginTop: 16 }}
                        resizeMode="contain"
                      />
                      {/* Logo de equipo superpuesto */}
                      {jugador.equipoLecLogo && (
                        <View className="absolute bottom-2 right-2 bg-midnight/90 p-1.5 rounded-xl border border-surface-light/30 shadow-2xl">
                          <Image source={{ uri: jugador.equipoLecLogo }} className="w-6 h-6" resizeMode="contain" />
                        </View>
                      )}
                    </>
                  ) : jugador.equipoLecLogo ? (
                    <Image source={{ uri: jugador.equipoLecLogo }} className="w-20 h-20 opacity-90" resizeMode="contain" />
                  ) : (
                    <Text className="text-accent-cyan text-3xl font-bold">{jugador.nickname?.substring(0, 1)}</Text>
                  )}
                </View>

                <View className="flex-1 ml-6 pt-2">
                  <Text className="text-white text-4xl font-black tracking-tighter uppercase italic leading-none">{jugador.nickname}</Text>
                  <Text className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">{jugador.nombreReal}</Text>

                  <View className="flex-row items-center mt-4">
                    <View className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <Text className="text-emerald-400 font-black text-sm">{(jugador.precioActual || jugador.precioBase)?.toLocaleString()} €</Text>
                    </View>
                    <View className="flex-row items-center ml-3 bg-surface/50 px-2 py-1 rounded-md">
                      {jugador.tendencia === 'SUBE' && <ChevronUp size={12} color="#10B981" />}
                      {jugador.tendencia === 'BAJA' && <ChevronDown size={12} color="#F43F5E" />}
                      <Text className={`text-[9px] font-black ml-1 ${jugador.tendencia === 'SUBE' ? 'text-emerald-400' :
                        jugador.tendencia === 'BAJA' ? 'text-rose-400' : 'text-gray-500'
                        }`}>
                        {jugador.tendencia === 'SUBE' ? 'SUBIENDO' :
                          jugador.tendencia === 'BAJA' ? 'BAJANDO' :
                            jugador.tendencia || 'ESTABLE'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dueño y Acciones */}
              <View className="mt-5 mx-6 pt-5 border-t border-surface-light/10">
                <View className="bg-midnight/40 rounded-[28px] p-5 border border-surface-light/10 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border ${jugador.propietarioNickname ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                      {jugador.propietarioNickname ? (
                        <Shield color="#00D1FF" size={22} />
                      ) : (
                        <Zap color="#00FF94" size={22} fill="#00FF94" opacity={0.2} />
                      )}
                    </View>
                    <View>
                      <Text className="text-gray-500 text-[9px] font-black uppercase tracking-[1.5px] mb-1">
                        {jugador.propietarioNickname ? 'CONTRATADO POR' : 'ESTADO ACTUAL'}
                      </Text>
                      {jugador.propietarioNickname ? (
                        <TouchableOpacity
                          onPress={() => router.push(`/(main)/rival/${jugador.propietarioEquipoId}`)}
                          className="flex-row items-center"
                        >
                          <Text className="text-white font-black text-lg italic uppercase tracking-tight">
                            {esPropietario ? "Tu Equipo" : jugador.propietarioNickname}
                          </Text>
                          {!esPropietario && <ChevronRight color="#00D1FF" size={18} className="ml-1" />}
                        </TouchableOpacity>
                      ) : (
                        <Text className="text-neon-green font-black text-lg italic uppercase tracking-tight">AGENTE LIBRE</Text>
                      )}
                    </View>
                  </View>

                  {!esPropietario && jugador.propietarioNickname && (
                    <TouchableOpacity
                      onPress={handleClausulazo}
                      disabled={isProcessing}
                      className="bg-rose-600 px-5 py-3 rounded-2xl flex-row items-center shadow-lg shadow-rose-900/40 active:scale-95"
                    >
                      <Zap size={14} color="white" strokeWidth={3} fill="white" />
                      <Text className="text-white font-black ml-2 text-[10px] uppercase">ROBAR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Evolución Gráfica */}
            <View className="mt-8">
              <View className="flex-row items-center ml-1 mb-4">
                <TrendingUp size={18} color="#00D1FF" />
                <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-2">Evolución Puntos</Text>
              </View>

              <View className="bg-surface rounded-3xl p-6 border border-surface-light/20">
                <View className="h-40 items-center justify-center">
                  {weeklyData.length > 0 ? (
                    <Svg height="140" width={width - 72}>
                      <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#00D1FF" stopOpacity="0.3" />
                          <Stop offset="1" stopColor="#00D1FF" stopOpacity="0" />
                        </LinearGradient>
                      </Defs>

                      {[0, 25, 50, 75, 100].map((tick) => (
                        <Line
                          key={tick}
                          x1="0"
                          y1={110 - tick}
                          x2={width - 72}
                          y2={110 - tick}
                          stroke="#374151"
                          strokeWidth="1"
                          strokeDasharray="4, 4"
                        />
                      ))}

                      {(() => {
                        const chartW = width - 72;
                        const padX = 30;
                        const chartH = 110;
                        const maxVal = Math.max(...weeklyData.map(d => d.value), 50);

                        const points = weeklyData.map((d, i) => {
                          const x = padX + (i / (weeklyData.length - 1 || 1)) * (chartW - padX * 2);
                          const y = chartH - (d.value / maxVal) * 80;
                          return { x, y, val: d.value, played: d.played, week: allWeeksAsc[i] };
                        });

                        const pathData = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, "");
                        const areaData = `${pathData} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

                        return (
                          <G>
                            <Path d={areaData} fill="url(#grad)" />
                            <Path d={pathData} fill="none" stroke="#00D1FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((p, i) => (
                              <G key={i}>
                                <Circle
                                  cx={p.x} cy={p.y}
                                  r={p.played ? 5 : 4}
                                  fill={p.played ? "#0B0E14" : "#1F2937"}
                                  stroke={p.played ? "#00D1FF" : "#4B5563"}
                                  strokeWidth="2"
                                />
                                <SvgText
                                  x={p.x} y={p.y - 14}
                                  fill={p.played ? "white" : "#6B7280"}
                                  fontSize="12" fontWeight="bold" textAnchor="middle"
                                >
                                  {p.played ? p.val : "NP"}
                                </SvgText>
                                <SvgText
                                  x={p.x} y={chartH + 20}
                                  fill="#6B7280"
                                  fontSize="10" fontWeight="bold" textAnchor="middle"
                                >
                                  W{p.week}
                                </SvgText>
                              </G>
                            ))}
                          </G>
                        );
                      })()}
                    </Svg>
                  ) : (
                    <Text className="text-gray-500 italic">Sin datos disponibles</Text>
                  )}
                </View>

                <View className="flex-row justify-between mt-6 pt-6 border-t border-surface-light/20">
                  <View className="items-center">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">MEDIA</Text>
                    <Text className="text-white text-xl font-black uppercase">{statsSummary.avgPoints} PTS</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">TOTAL TEMP.</Text>
                    <Text className="text-accent-cyan text-xl font-black uppercase">
                      {Math.round(weeklyData.reduce((acc, d) => acc + d.value, 0))} PTS
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Radar Técnico */}
            <View className="mt-8 mb-4">
              <View className="flex-row items-center ml-1 mb-4">
                <Activity size={18} color="#00D1FF" />
                <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-2">Comparativa Técnica</Text>
              </View>

              <View className="bg-surface rounded-3xl p-6 border border-surface-light/20 items-center">
                <Svg height="220" width={width - 72} viewBox="0 0 200 200">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                    <Polygon
                      key={i}
                      points={radarPoints.map((_, idx) => {
                        const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                        return `${100 + 80 * r * Math.cos(angle)},${100 + 80 * r * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="none" stroke="#374151" strokeWidth="1"
                    />
                  ))}
                  {radarPoints.map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <Line key={idx} x1="100" y1="100" x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke="#374151" strokeWidth="1" />;
                  })}

                  {/* Media de liga */}
                  <Polygon
                    points={avgRadarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#4B556330" stroke="#6B7280" strokeWidth="1.5"
                  />

                  {/* Stats Jugador */}
                  <Polygon
                    points={radarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#00D1FF20" stroke="#00D1FF" strokeWidth="2.5"
                  />

                  {['KDA', 'CS/M', 'PTS', 'DMG', 'MIT', 'VIS'].map((label, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <SvgText key={idx} x={100 + 95 * Math.cos(angle)} y={100 + 95 * Math.sin(angle)} fill="#9CA3AF" fontSize="11" fontWeight="bold" textAnchor="middle">{label}</SvgText>;
                  })}
                </Svg>

                <View className="flex-row mt-6">
                  <View className="flex-row items-center mx-4">
                    <View className="w-2.5 h-2.5 rounded-full bg-accent-cyan mr-2" />
                    <Text className="text-gray-300 text-xs font-bold">{jugador.nickname}</Text>
                  </View>
                  <View className="flex-row items-center mx-4">
                    <View className="w-2.5 h-2.5 rounded-full bg-gray-500 mr-2" />
                    <Text className="text-gray-300 text-xs font-bold">Media Liga</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB: PARTIDOS */}
        {activeTab === 'PARTIDOS' && (
          <View className="p-4 mt-2">
            {allWeeks.length === 0 && (
              <Text className="text-gray-500 italic text-center mt-10">Aún no hay partidos registrados.</Text>
            )}

            {allWeeks.map(week => {
              const weekStats = groupedStats[week];

              if (!weekStats) {
                return (
                  <View key={week} className="mb-8">
                    <Text className="text-white text-lg font-black mb-3 uppercase italic tracking-wider">SEMANA {week}</Text>
                    <View className="bg-surface p-6 rounded-2xl border border-dashed border-surface-light/30 items-center">
                      <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{jugador.equipoLecNombre || 'EL EQUIPO'} NO JUGÓ</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={week} className="mb-8">
                  <Text className="text-white text-lg font-black mb-3 uppercase italic tracking-wider">SEMANA {week}</Text>

                  {Object.keys(weekStats).sort((a, b) => {
                    const dateA = new Date(weekStats[a][0].fecha).getTime();
                    const dateB = new Date(weekStats[b][0].fecha).getTime();
                    return dateB - dateA; // Más reciente arriba
                  }).map(serieId => {
                    const maps = weekStats[serieId];
                    const isExpanded = expandedSeries[serieId];
                    const currentMapIdx = selectedMapIndex[serieId] || 0;
                    const map = maps[currentMapIdx];
                    if (!map) return null;

                    const totalSeriePoints = Math.round(maps.reduce((acc, m) => acc + (m.puntosGenerados || 0), 0));
                    const wins = maps.filter(m => m.resultado === 'WIN').length;
                    const losses = maps.length - wins;
                    const isAce = maps.length === 2 && wins === 2;
                    const globalResult = wins > losses ? 'WIN' : 'LOSS';
                    const displayResult = isExpanded ? (map.resultado || 'LOSS') : globalResult;

                    const isTeam1 = map.team1?.toLowerCase() === jugador.equipoLecNombre?.toLowerCase();
                    const rival = isTeam1 ? (map.team2 || 'Rival') : (map.team1 || 'Rival');
                    const rivalLogo = isTeam1 ? map.team2Logo : map.team1Logo;

                    return (
                      <View key={serieId} className="bg-surface rounded-2xl p-5 mb-4 border border-surface-light/20 shadow-sm">
                        <TouchableOpacity onPress={() => toggleSerie(serieId)} className="flex-row justify-between items-center">
                          <View className="flex-1 mr-4">
                            <View className="flex-row items-center">
                              <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mr-2">vs</Text>
                              <View className="w-8 h-8 bg-surface-light/10 rounded-lg items-center justify-center mr-1 border border-surface-light/10">
                                {rivalLogo ? (
                                  <Image
                                    key={rivalLogo}
                                    source={{ uri: rivalLogo }}
                                    style={{ width: 24, height: 24 }}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Text className="text-[8px] text-gray-500 font-black">{rival.substring(0, 2)}</Text>
                                )}
                              </View>
                              <Text className="text-white text-xl font-black flex-shrink" numberOfLines={1}>{rival}</Text>
                              {isAce && (
                                <View className="bg-accent-cyan/20 px-2 py-0.5 rounded-lg ml-2 border border-accent-cyan/30">
                                  <Text className="text-accent-cyan text-[9px] font-black tracking-widest uppercase">ACE</Text>
                                </View>
                              )}
                            </View>
                            <View className="flex-row items-center mt-1">
                              <Text className="text-accent-cyan text-base font-black">{totalSeriePoints}</Text>
                              <Text className="text-gray-500 text-[9px] font-bold ml-2 uppercase tracking-widest">Pts Fantasy</Text>
                            </View>
                          </View>

                          <View className="flex-row items-center">
                            <View className={`px-3 py-1.5 rounded-lg mr-4 ${displayResult === 'WIN' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                              <Text className={`text-[10px] font-black tracking-widest ${displayResult === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {displayResult === 'WIN' ? 'VICTORIA' : 'DERROTA'}
                              </Text>
                            </View>
                            {isExpanded ? <ChevronDown color="#9CA3AF" size={20} /> : <ChevronRight color="#9CA3AF" size={20} />}
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View className="mt-5 pt-5 border-t border-surface-light/10">
                            {/* Selector de Mapas */}
                            <View className="flex-row mb-5 bg-midnight rounded-xl p-1.5 border border-surface-light/20">
                              {maps.map((_, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => selectMap(serieId, idx)}
                                  className={`flex-1 py-2.5 items-center rounded-lg ${currentMapIdx === idx ? 'bg-accent-cyan/10 border border-accent-cyan/30' : ''}`}
                                >
                                  <Text className={`text-xs font-black tracking-widest ${currentMapIdx === idx ? 'text-accent-cyan' : 'text-gray-500'}`}>MAPA {idx + 1}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            {/* Detalles del Mapa Seleccionado */}
                            <View className="bg-midnight rounded-2xl p-5 border border-surface-light/20">
                              <View className="flex-row flex-wrap justify-between">
                                {(() => {
                                  const stats = [
                                    { icon: <Swords size={18} color="#00D1FF" />, label: 'KILLS', val: map.kills, pts: map.kills * 3 },
                                    { icon: <Skull size={18} color="#FB7185" />, label: 'DEATHS', val: map.deaths, pts: map.deaths * -1 },
                                    { icon: <Users size={18} color="#00D1FF" />, label: 'ASSISTS', val: map.assists, pts: Math.round(map.assists * 1.5 * 10) / 10 },
                                    { icon: <Wheat size={18} color="#FBBF24" />, label: 'FARM', val: map.cs, pts: Math.round(map.cs * 0.02 * 100) / 100 },
                                  ];

                                  return stats.map((s, i) => (
                                    <View key={i} className="w-[48%] bg-surface rounded-xl p-4 items-center mb-3 border border-surface-light/10">
                                      <View className="w-10 h-10 rounded-xl bg-midnight items-center justify-center mb-2 border border-surface-light/20">
                                        {s.icon}
                                      </View>
                                      <Text className="text-gray-500 text-[10px] font-black mb-1.5 tracking-widest">{s.label}</Text>
                                      <Text className="text-white text-xl font-bold mb-2">{s.val}</Text>

                                      <View className={`px-2.5 py-1 rounded-md ${s.pts === 0 ? 'bg-gray-800' : s.pts > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                        <Text className={`text-[10px] font-black ${s.pts === 0 ? 'text-gray-400' : s.pts > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {s.pts > 0 ? `+${s.pts}` : s.pts}
                                        </Text>
                                      </View>
                                    </View>
                                  ));
                                })()}
                              </View>

                              {map.resultado === 'WIN' && (
                                <View className="flex-row justify-between items-center bg-emerald-500/10 p-3.5 rounded-xl mb-4 mt-2 border border-dashed border-emerald-500/30">
                                  <Text className="text-emerald-400 text-xs font-black tracking-widest">BONUS VICTORIA</Text>
                                  <Text className="text-emerald-400 text-sm font-bold">+5 PTS</Text>
                                </View>
                              )}

                              {/* Nuevo Desglose de Puntos - Orientado al mapa y transparencia */}
                              <View className="bg-midnight/60 p-6 rounded-[32px] border border-surface-light/20 mt-4">
                                {/* GRANDE Y BLANCO: Puntos de este mapa */}
                                <View className="items-center mb-6">
                                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Rendimiento Mapa {currentMapIdx + 1}</Text>
                                  <View className="flex-row items-baseline">
                                    <Text className="text-white text-6xl font-black tracking-tighter">{Math.round(map.puntosReales || 0)}</Text>
                                    <Text className="text-gray-400 text-lg font-black ml-2 uppercase">Pts</Text>
                                  </View>
                                </View>

                                <View className="h-[1px] bg-white/5 mb-6" />

                                {/* SECCIÓN CÁLCULO: Pequeño y detallado */}
                                <View>
                                  <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-4">Cálculo de la Serie</Text>

                                  {/* Lista de mapas de la serie */}
                                  <View className="mb-4">
                                    {maps.map((m, i) => (
                                      <View key={i} className="flex-row justify-between items-center opacity-60 mb-1">
                                        <Text className="text-gray-400 text-xs font-bold">Puntos Mapa {i + 1}</Text>
                                        <Text className="text-white text-xs font-black">{Math.round(m.puntosReales || 0)}</Text>
                                      </View>
                                    ))}
                                  </View>

                                  {/* La Fórmula */}
                                  <View className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/5">
                                    <View className="flex-row justify-between items-center mb-2">
                                      <Text className="text-gray-400 text-[10px] font-medium italic">Promedio ({maps.map(m => Math.round(m.puntosReales)).join(' + ')}) / {maps.length}</Text>
                                      <Text className="text-white text-sm font-black">{Math.round(maps.reduce((acc, m) => acc + (m.puntosReales || 0), 0) / maps.length)}</Text>
                                    </View>
                                    {isAce && (
                                      <View className="flex-row justify-between items-center">
                                        <Text className="text-accent-cyan text-[10px] font-black uppercase tracking-tighter italic">Bono ACE (Victoria 2-0)</Text>
                                        <Text className="text-accent-cyan text-sm font-black">+5</Text>
                                      </View>
                                    )}
                                  </View>

                                  {/* Resultado Final Ranking (Cian y elegante) */}
                                  <View className="flex-row justify-between items-end">
                                    <View>
                                      <Text className="text-accent-cyan text-[10px] font-black uppercase italic tracking-wider">Total para Ranking</Text>
                                      <Text className="text-gray-600 text-[8px] font-bold uppercase">Suma final de la serie</Text>
                                    </View>
                                    <View className="items-end">
                                      <Text className="text-accent-cyan text-3xl font-black leading-none">{totalSeriePoints}</Text>
                                      <Text className="text-accent-cyan/60 text-[8px] font-black uppercase tracking-tighter mt-1">Pts Fantasy</Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* TAB: STATS */}
        {activeTab === 'STATS' && (
          <View className="p-4 mt-2 mb-8">
            <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-1 mb-4">Promedios de Temporada</Text>
            <View className="bg-surface rounded-2xl overflow-hidden border border-surface-light/20">
              {[
                { label: 'Asesinatos', val: (estadisticas.reduce((acc, s) => acc + s.kills, 0) / (estadisticas.length || 1)).toFixed(1) },
                { label: 'Muertes', val: (estadisticas.reduce((acc, s) => acc + s.deaths, 0) / (estadisticas.length || 1)).toFixed(1) },
                { label: 'Asistencias', val: (estadisticas.reduce((acc, s) => acc + s.assists, 0) / (estadisticas.length || 1)).toFixed(1) },
                { label: 'KDA Ratio', val: statsSummary.kda },
                { label: 'CS por Minuto', val: statsSummary.csMin },
                { label: 'Visión / Minuto', val: statsSummary.vision },
                { label: 'Daño Infligido', val: '18.5k' },
                { label: 'Victorias Totales', val: estadisticas.filter(s => s.resultado === 'WIN').length, isLast: true },
              ].map((item, i) => (
                <View key={i} className={`flex-row justify-between p-5 ${!item.isLast ? 'border-b border-surface-light/10' : ''}`}>
                  <Text className="text-gray-300 text-sm font-bold tracking-wide">{item.label}</Text>
                  <Text className="text-accent-cyan text-sm font-black">{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}