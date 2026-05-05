import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Polyline, Circle, Line, Polygon, G, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import api from '../../api/api';
import { Jugador, JugadorEstadistica } from '../../types';
import {
  ChevronLeft,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Swords,
  TrendingUp,
  Activity,
  Skull,
  Users,
  Wheat
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function JugadorDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [estadisticas, setEstadisticas] = useState<JugadorEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'PARTIDOS' | 'STATS'>('RESUMEN');
  const [selectedMapIndex, setSelectedMapIndex] = useState<Record<string, number>>({});
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  const [maxWeek, setMaxWeek] = useState(1);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const [jugadorRes, statsRes, semanaRes] = await Promise.all([
          api.get(`/jugadores/${id}`),
          api.get(`/jugadores/${id}/estadisticas`),
          api.get('/liga/semana-actual')
        ]);
        setJugador(jugadorRes.data);
        setEstadisticas(statsRes.data);
        setMaxWeek(semanaRes.data || 1);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const selectMap = (serieId: string, index: number) => {
    setSelectedMapIndex(prev => ({ ...prev, [serieId]: index }));
  };

  const toggleSerie = (serieId: string) => {
    setExpandedSeries(prev => ({ ...prev, [serieId]: !prev[serieId] }));
  };

  if (loading) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!jugador) return null;

  const groupedStats: Record<number, Record<string, JugadorEstadistica[]>> = {};
  estadisticas.forEach(stat => {
    const w = stat.semana || 1;
    const s = stat.serieId || `GAME_${stat.gameId}`;
    if (!groupedStats[w]) groupedStats[w] = {};
    if (!groupedStats[w][s]) groupedStats[w][s] = [];
    groupedStats[w][s].push(stat);
  });

  const statsWeeks = Object.keys(groupedStats).map(Number).sort((a, b) => a - b);
  const allWeeks = statsWeeks.slice().sort((a, b) => b - a);
  const allWeeksAsc = statsWeeks;

  const weeklyData = allWeeksAsc.map(w => {
    const weekMatches = groupedStats[w];
    if (!weekMatches) return { value: 0, played: false };

    const seriesSums = Object.values(weekMatches).map(maps => {
      return maps.reduce((acc, m) => acc + m.puntosGenerados, 0);
    });
    const totalWeek = seriesSums.reduce((acc, p) => acc + p, 0) / (seriesSums.length || 1);
    return { value: Math.round(totalWeek), played: true };
  });

  const playedWeeksData = weeklyData.filter(d => d.played);
  const avgPointsPerWeek = playedWeeksData.length > 0 
    ? (playedWeeksData.reduce((acc, d) => acc + d.value, 0) / playedWeeksData.length).toFixed(0)
    : "0";

  const statsSummary = {
    kda: (estadisticas.reduce((acc, s) => acc + (s.kills + s.assists) / (s.deaths || 1), 0) / (estadisticas.length || 1)).toFixed(2),
    csMin: (estadisticas.reduce((acc, s) => acc + s.cs, 0) / (estadisticas.length * 30 || 1)).toFixed(1),
    avgPoints: avgPointsPerWeek,
    damage: 18500,
    mitigated: 12200,
    vision: 1.4
  };

  const radarPoints = [85, 70, 90, 65, 55, 75];
  const avgRadarPoints = [60, 65, 50, 55, 60, 50];

  return (
    <SafeAreaView className="flex-1 bg-midnight">
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-surface rounded-xl border border-surface-light/50">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold ml-4">Detalle del Jugador</Text>
      </View>

      <View className="flex-row px-4 border-b border-surface-light/20">
        {(['RESUMEN', 'PARTIDOS', 'STATS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`py-4 mr-6 border-b-2 ${activeTab === tab ? 'border-accent-cyan' : 'border-transparent'}`}
          >
            <Text className={`text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'text-accent-cyan' : 'text-gray-500'}`}>
              {tab === 'STATS' ? 'ESTADÍSTICAS' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1">
        {activeTab === 'RESUMEN' && (
          <View className="p-4">
            <View className="items-center py-8 bg-surface mx-0 rounded-3xl border border-surface-light/30 shadow-2xl">
              <View className="w-20 h-20 bg-accent-cyan/10 rounded-full items-center justify-center mb-4 border border-accent-cyan/20">
                {jugador.equipoLec?.logoUrl ? (
                  <Image 
                    source={{ uri: jugador.equipoLec.logoUrl }} 
                    className="w-14 h-14"
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="text-accent-cyan text-3xl font-bold">{jugador.nickname?.substring(0, 1)}</Text>
                )}
              </View>
              <Text className="text-white text-3xl font-black tracking-tight">{jugador.nickname}</Text>
              <Text className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">{jugador.equipoLec?.nombre} • {jugador.rol}</Text>
              <View className="flex-row items-center mt-4 bg-neon-green/10 px-4 py-2 rounded-full border border-neon-green/20">
                <Text className="text-neon-green font-bold text-base">{jugador.precioBase?.toLocaleString()} €</Text>
              </View>
            </View>

            <View className="mt-8">
              <View className="flex-row items-center ml-1 mb-4">
                <TrendingUp size={16} color="#00D1FF" />
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[2px] ml-2">EVOLUCIÓN PUNTOS</Text>
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
                          stroke="#2D3748"
                          strokeWidth="0.5"
                          strokeDasharray="5, 5"
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

                        const pathData = points.reduce((acc, p, i) => 
                          acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, "");
                        const areaData = `${pathData} L ${points[points.length-1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

                        return (
                          <G>
                            <Path d={areaData} fill="url(#grad)" />
                            <Path d={pathData} fill="none" stroke="#00D1FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((p, i) => (
                              <G key={i}>
                                <Circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r={p.played ? 4 : 3} 
                                  fill={p.played ? "#0B0E14" : "#2D3748"} 
                                  stroke={p.played ? "#00D1FF" : "#4A5568"} 
                                  strokeWidth="2" 
                                />
                                <SvgText 
                                  x={p.x} 
                                  y={p.y - 12} 
                                  fill={p.played ? "white" : "#4A5568"} 
                                  fontSize={p.played ? "11" : "9"} 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  {p.played ? p.val : "NP"}
                                </SvgText>
                                <SvgText 
                                  x={p.x} 
                                  y={chartH + 20} 
                                  fill="#4A5568" 
                                  fontSize="9" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
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
                    <Text className="text-gray-600 text-xs">Sin datos disponibles</Text>
                  )}
                </View>
                <View className="flex-row justify-between mt-4 pt-6 border-t border-surface-light/20">
                  <View className="items-center">
                    <Text className="text-gray-500 text-[8px] font-black uppercase mb-1">MEDIA</Text>
                    <Text className="text-white text-lg font-bold">{statsSummary.avgPoints} PTS</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-500 text-[8px] font-black uppercase mb-1">TOTAL TEMP.</Text>
                    <Text className="text-accent-cyan text-lg font-bold">
                      {Math.round(weeklyData.reduce((acc, d) => acc + d.value, 0))} PTS
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-8">
              <View className="flex-row items-center ml-1 mb-4">
                <Activity size={16} color="#00D1FF" />
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[2px] ml-2">COMPARATIVA TÉCNICA</Text>
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
                      fill="none" stroke="#2D3748" strokeWidth="0.5"
                    />
                  ))}
                  {radarPoints.map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <Line key={idx} x1="100" y1="100" x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke="#2D3748" strokeWidth="0.5" />;
                  })}
                  <Polygon
                    points={avgRadarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#4A556830" stroke="#4A5568" strokeWidth="1"
                  />
                  <Polygon
                    points={radarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#00D1FF30" stroke="#00D1FF" strokeWidth="2"
                  />
                  {['KDA', 'CS/M', 'PTS', 'DMG', 'MIT', 'VIS'].map((label, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <SvgText key={idx} x={100 + 95 * Math.cos(angle)} y={100 + 95 * Math.sin(angle)} fill="#718096" fontSize="10" fontWeight="bold" textAnchor="middle">{label}</SvgText>;
                  })}
                </Svg>
                <View className="flex-row mt-4">
                  <View className="flex-row items-center mx-3">
                    <View className="w-2 h-2 rounded-full bg-accent-cyan mr-2" />
                    <Text className="text-gray-400 text-xs font-bold">{jugador.nickname}</Text>
                  </View>
                  <View className="flex-row items-center mx-3">
                    <View className="w-2 h-2 rounded-full bg-gray-600 mr-2" />
                    <Text className="text-gray-400 text-xs font-bold">Media Liga</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'PARTIDOS' && (
          <View className="p-4">
            {allWeeks.map(week => {
              const weekStats = groupedStats[week];
              if (!weekStats) {
                return (
                  <View key={week} className="mb-6">
                    <Text className="text-white text-xl font-black mb-4">SEMANA {week}</Text>
                    <View className="bg-surface p-6 rounded-3xl border border-dashed border-surface-light/40 items-center">
                      <Text className="text-gray-500 text-xs font-bold uppercase">{jugador.equipoLec?.nombre} NO JUGÓ</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={week} className="mb-6">
                  <Text className="text-white text-xl font-black mb-4">SEMANA {week}</Text>
                  {Object.keys(weekStats).map(serieId => {
                    const maps = weekStats[serieId];
                    const isExpanded = expandedSeries[serieId];
                    const currentMapIdx = selectedMapIndex[serieId] || 0;
                    const map = maps[currentMapIdx];
                    if (!map) return null;

                    const totalSeriePoints = maps.reduce((acc, m) => acc + Math.round(m.puntosGenerados || 0), 0);
                    const wins = maps.filter(m => m.resultado === 'WIN').length;
                    const losses = maps.length - wins;
                    const globalResult = wins > losses ? 'WIN' : 'LOSS';
                    const displayResult = isExpanded ? (map.resultado || 'LOSS') : globalResult;

                    const rival = (map.team1?.toLowerCase() === jugador.equipoLec?.nombre?.toLowerCase()) 
                      ? (map.team2 || 'Rival') 
                      : (map.team1 || 'Rival');

                    return (
                      <View key={serieId} className="bg-surface rounded-3xl p-5 mb-4 border border-surface-light/30">
                        <TouchableOpacity onPress={() => toggleSerie(serieId)} className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-white text-lg font-bold">vs {rival}</Text>
                            <Text className="text-gray-500 text-xs font-medium mt-1">{totalSeriePoints} Puntos totales</Text>
                          </View>
                          <View className="flex-row items-center">
                            <View className={`px-3 py-1 rounded-lg mr-3 ${displayResult === 'WIN' ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-crimson/10 border border-crimson/30'}`}>
                              <Text className={`text-[10px] font-black ${displayResult === 'WIN' ? 'text-neon-green' : 'text-crimson'}`}>
                                {displayResult === 'WIN' ? 'VICTORIA' : 'DERROTA'}
                              </Text>
                            </View>
                            {isExpanded ? <ChevronDown color="#718096" size={20} /> : <ChevronRight color="#718096" size={20} />}
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View className="mt-6">
                            <View className="flex-row mb-6 bg-midnight rounded-xl p-1">
                              {maps.map((_, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => selectMap(serieId, idx)}
                                  className={`flex-1 py-2 items-center rounded-lg ${currentMapIdx === idx ? 'bg-accent-cyan' : ''}`}
                                >
                                  <Text className={`text-[10px] font-black ${currentMapIdx === idx ? 'text-midnight' : 'text-gray-500'}`}>MAPA {idx + 1}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            <View className="bg-midnight rounded-2xl p-4 border border-surface-light/30">
                              <View className="flex-row flex-wrap justify-between">
                                {(() => {
                                  const stats = [
                                    { icon: <Swords size={16} color="#00D1FF" />, label: 'KILLS', val: map.kills, pts: Math.round(map.kills * 3), color: 'green' },
                                    { icon: <Skull size={16} color="#FF003F" />, label: 'DEATHS', val: map.deaths, pts: Math.round(map.deaths * -1), color: 'red' },
                                    { icon: <Users size={16} color="#00D1FF" />, label: 'ASSISTS', val: map.assists, pts: Math.round(map.assists * 1.5), color: 'green' },
                                    { icon: <Wheat size={16} color="#FFD700" />, label: 'FARM', val: map.cs, pts: Math.round(map.cs * 0.02), color: 'green' },
                                  ];

                                  return stats.map((s, i) => (
                                    <View key={i} className="w-[48%] bg-surface rounded-xl p-3 items-center mb-3 border border-surface-light/20">
                                      <View className="w-8 h-8 rounded-lg bg-midnight items-center justify-center mb-2">
                                        {s.icon}
                                      </View>
                                      <Text className="text-gray-500 text-[8px] font-black mb-1">{s.label}</Text>
                                      <Text className="text-white text-lg font-bold mb-2">{s.val}</Text>
                                      <View className={`px-2 py-0.5 rounded ${s.pts === 0 ? 'bg-gray-700' : s.pts > 0 ? 'bg-neon-green/10' : 'bg-crimson/10'}`}>
                                        <Text className={`text-[9px] font-black ${s.pts === 0 ? 'text-gray-400' : s.pts > 0 ? 'text-neon-green' : 'text-crimson'}`}>
                                          {s.pts >= 0 ? `+${s.pts}` : s.pts}
                                        </Text>
                                      </View>
                                    </View>
                                  ));
                                })()}
                              </View>

                              {map.resultado === 'WIN' && (
                                <View className="flex-row justify-between items-center bg-neon-green/5 p-3 rounded-xl mb-4 border border-dashed border-neon-green/30">
                                  <Text className="text-neon-green text-[10px] font-black">BONUS VICTORIA</Text>
                                  <Text className="text-neon-green text-xs font-bold">+5 PTS</Text>
                                </View>
                              )}

                              <View className="items-center pt-4 border-t border-surface-light/10">
                                <Text className="text-gray-500 text-[8px] font-black mb-2 tracking-widest">PUNTUACIÓN MAPA</Text>
                                <View className="flex-row items-baseline">
                                  <Text className={`text-3xl font-black ${Math.round(map.puntosGenerados) < 0 ? 'text-crimson' : 'text-accent-cyan'}`}>
                                    {Math.round(map.puntosGenerados)}
                                  </Text>
                                  <Text className={`text-xs font-bold ml-1 ${Math.round(map.puntosGenerados) < 0 ? 'text-crimson' : 'text-accent-cyan'}`}>PTS</Text>
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

        {activeTab === 'STATS' && (
          <View className="p-4">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[2px] ml-1 mb-4">PROMEDIOS TEMP.</Text>
            <View className="bg-surface rounded-3xl overflow-hidden border border-surface-light/20">
              {[
                { label: 'Asesinatos', val: (estadisticas.reduce((acc, s) => acc + s.kills, 0) / estadisticas.length).toFixed(1) },
                { label: 'Muertes', val: (estadisticas.reduce((acc, s) => acc + s.deaths, 0) / estadisticas.length).toFixed(1) },
                { label: 'Asistencias', val: (estadisticas.reduce((acc, s) => acc + s.assists, 0) / estadisticas.length).toFixed(1) },
                { label: 'KDA', val: statsSummary.kda },
                { label: 'CS por Minuto', val: statsSummary.csMin },
                { label: 'Vision Score/Min', val: statsSummary.vision },
                { label: 'Daño Infligido', val: '18.5k' },
                { label: 'Victorias', val: estadisticas.filter(s => s.resultado === 'WIN').length, isLast: true },
              ].map((item, i) => (
                <View key={i} className={`flex-row justify-between p-5 ${!item.isLast ? 'border-b border-surface-light/10' : ''}`}>
                  <Text className="text-gray-400 text-sm font-medium">{item.label}</Text>
                  <Text className="text-white text-sm font-black">{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}