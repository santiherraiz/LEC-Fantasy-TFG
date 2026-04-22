import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
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

  const statsWeeks = Object.keys(groupedStats).map(Number);
  const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1).sort((a, b) => b - a);
  const allWeeksAsc = Array.from({ length: maxWeek }, (_, i) => i + 1);

  const weeklyData = allWeeksAsc.map(w => {
    const weekMatches = groupedStats[w];
    if (!weekMatches) return { value: 0, played: false };

    // Calculamos la SUMA de cada serie
    const seriesSums = Object.values(weekMatches).map(maps => {
      return maps.reduce((acc, m) => acc + m.puntosGenerados, 0);
    });
    // La puntuación de la semana es la MEDIA de las SUMAS de las series
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Jugador</Text>
      </View>

      <View style={styles.topTabBar}>
        {(['RESUMEN', 'PARTIDOS', 'STATS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.topTabItem, activeTab === tab && styles.topTabActive]}
          >
            <Text style={[styles.topTabText, activeTab === tab && styles.topTabTextActive]}>
              {tab === 'STATS' ? 'ESTADÍSTICAS' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }}>
        {activeTab === 'RESUMEN' && (
          <View style={{ padding: 16 }}>
            <View style={styles.heroSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{jugador.nickname?.substring(0, 1)}</Text>
              </View>
              <Text style={styles.playerName}>{jugador.nickname}</Text>
              <Text style={styles.playerSub}>{jugador.equipoLec} • {jugador.rol}</Text>
              <View style={styles.priceTag}>
                <DollarSign size={14} color="#10B981" />
                <Text style={styles.priceText}>{jugador.precioBase?.toLocaleString()} €</Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.labelWithIcon}>
                <TrendingUp size={16} color="#64748B" />
                <Text style={styles.sectionLabel}>EVOLUCIÓN PUNTOS SEMANALES</Text>
              </View>
              <View style={styles.graphCard}>
                <View style={styles.chartContainer}>
                  {weeklyData.length > 0 ? (
                    <Svg height="140" width={width - 72}>
                      <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.3" />
                          <Stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      
                      {/* Líneas de fondo horizontal */}
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <Line
                          key={tick}
                          x1="0"
                          y1={110 - tick}
                          x2={width - 72}
                          y2={110 - tick}
                          stroke="#334155"
                          strokeWidth="0.5"
                          strokeDasharray="5, 5"
                        />
                      ))}

                      {(() => {
                        const chartW = width - 72;
                        const padX = 30; // Margen para que no se corten los textos
                        const chartH = 110;
                        const maxVal = Math.max(...weeklyData.map(d => d.value), 50);
                        
                        // Generar puntos de la línea
                        const points = weeklyData.map((d, i) => {
                          const x = padX + (i / (weeklyData.length - 1 || 1)) * (chartW - padX * 2);
                          const y = chartH - (d.value / maxVal) * 80;
                          return { x, y, val: d.value, played: d.played, week: allWeeksAsc[i] };
                        });

                        // Construir el path para el área rellena
                        const pathData = points.reduce((acc, p, i) => 
                          acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, "");
                        const areaData = `${pathData} L ${points[points.length-1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

                        return (
                          <G>
                            {/* Área con degradado */}
                            <Path d={areaData} fill="url(#grad)" />
                            
                            {/* Línea principal */}
                            <Path d={pathData} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Puntos y etiquetas */}
                            {points.map((p, i) => (
                              <G key={i}>
                                <Circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r={p.played ? 4 : 3} 
                                  fill={p.played ? "#0F172A" : "#334155"} 
                                  stroke={p.played ? "#3B82F6" : "#64748B"} 
                                  strokeWidth="2" 
                                />
                                <SvgText 
                                  x={p.x} 
                                  y={p.y - 12} 
                                  fill={p.played ? "white" : "#64748B"} 
                                  fontSize={p.played ? "11" : "9"} 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  {p.played ? p.val : "NP"}
                                </SvgText>
                                <SvgText 
                                  x={p.x} 
                                  y={chartH + 20} 
                                  fill="#64748B" 
                                  fontSize="9" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  SEM {p.week}
                                </SvgText>
                              </G>
                            ))}
                          </G>
                        );
                      })()}
                    </Svg>
                  ) : (
                    <Text style={{ color: '#64748B', fontSize: 12 }}>Sin datos suficientes</Text>
                  )}
                </View>
                <View style={styles.graphFooter}>
                  <View style={styles.footerStatItem}>
                    <Text style={styles.footerStatLabel}>MEDIA</Text>
                    <Text style={styles.footerStatValue}>{statsSummary.avgPoints} PTS</Text>
                  </View>
                  <View style={styles.footerStatItem}>
                    <Text style={styles.footerStatLabel}>TOTAL J1-{maxWeek}</Text>
                    <Text style={[styles.footerStatValue, { color: '#3B82F6' }]}>
                      {Math.round(estadisticas.reduce((acc, s) => acc + s.puntosGenerados, 0))} PTS
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.labelWithIcon}>
                <Activity size={16} color="#64748B" />
                <Text style={styles.sectionLabel}>ANÁLISIS DE RENDIMIENTO COMPARADO</Text>
              </View>
              <View style={styles.radarCard}>
                <Svg height="220" width={width - 72} viewBox="0 0 200 200">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                    <Polygon
                      key={i}
                      points={radarPoints.map((_, idx) => {
                        const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                        return `${100 + 80 * r * Math.cos(angle)},${100 + 80 * r * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="none" stroke="#334155" strokeWidth="0.5"
                    />
                  ))}
                  {radarPoints.map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <Line key={idx} x1="100" y1="100" x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke="#334155" strokeWidth="0.5" />;
                  })}
                  <Polygon
                    points={avgRadarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#4B556340" stroke="#4B5563" strokeWidth="1"
                  />
                  <Polygon
                    points={radarPoints.map((p, idx) => {
                      const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                      return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="#3B82F660" stroke="#3B82F6" strokeWidth="2"
                  />
                  {['KDA', 'CS/M', 'PTS', 'DMG', 'MIT', 'VIS'].map((label, idx) => {
                    const angle = (idx * 2 * Math.PI) / radarPoints.length - Math.PI / 2;
                    return <SvgText key={idx} x={100 + 95 * Math.cos(angle)} y={100 + 95 * Math.sin(angle)} fill="#94A3B8" fontSize="10" textAnchor="middle">{label}</SvgText>;
                  })}
                </Svg>
                <View style={styles.radarLegend}>
                  <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>{jugador.nickname}</Text></View>
                  <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#4B5563' }]} /><Text style={styles.legendText}>Media Liga</Text></View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'PARTIDOS' && (
          <View style={{ padding: 16 }}>
            {allWeeks.map(week => {
              const weekStats = groupedStats[week];

              if (!weekStats) {
                return (
                  <View key={week} style={{ marginBottom: 24 }}>
                    <Text style={styles.weekTitleLabel}>SEMANA {week}</Text>
                    <View style={styles.noPlayCard}>
                      <Text style={styles.noPlayText}>{jugador.equipoLec?.toUpperCase()} no jugó esta semana</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={week} style={{ marginBottom: 24 }}>
                  <Text style={styles.weekTitleLabel}>SEMANA {week}</Text>
                  {Object.keys(weekStats).map(serieId => {
                    const maps = weekStats[serieId];
                    const isExpanded = expandedSeries[serieId];
                    const currentMapIdx = selectedMapIndex[serieId] || 0;
                    const map = maps[currentMapIdx];

                    if (!map) return null;

                    const totalSeriePoints = maps.reduce((acc, m) => acc + Math.round(m.puntosGenerados || 0), 0);

                    // Resultado Global (para cuando está cerrado)
                    const wins = maps.filter(m => m.resultado === 'WIN').length;
                    const losses = maps.length - wins;
                    const globalResult = wins > losses ? 'WIN' : 'LOSS';

                    // Resultado Dinámico (Cambia si está expandido)
                    const displayResult = isExpanded ? (map.resultado || 'LOSS') : globalResult;

                    const rival = (map.team1?.toLowerCase() === jugador.equipoLec?.toLowerCase()) 
                      ? (map.team2 || 'Rival') 
                      : (map.team1 || 'Rival');
                    return (
                      <View key={serieId} style={styles.serieCard}>
                        <TouchableOpacity onPress={() => toggleSerie(serieId)} style={styles.serieHeaderTouchable}>
                          <View>
                            <Text style={styles.rivalText}>vs {rival}</Text>
                            <Text style={styles.serieTotalPoints}>{totalSeriePoints} Puntos totales</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.resBadge, displayResult === 'WIN' ? styles.winB : styles.lossB]}>
                              <Text style={[styles.resText, displayResult === 'WIN' ? { color: '#10B981' } : { color: '#EF4444' }]}>
                                {displayResult === 'WIN' ? 'VICTORIA' : 'DERROTA'}
                              </Text>
                            </View>
                            {isExpanded ? <ChevronDown color="#64748B" size={24} /> : <ChevronRight color="#64748B" size={24} />}
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={{ marginTop: 16 }}>
                            <View style={styles.mapSelector}>
                              {maps.map((_, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => selectMap(serieId, idx)}
                                  style={[styles.mapTab, currentMapIdx === idx && styles.mapTabActive]}
                                >
                                  <Text style={[styles.mapTabText, currentMapIdx === idx && styles.mapTabTextActive]}>MAPA {idx + 1}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            <View style={styles.mapDetailContainer}>
                              <View style={styles.modernStatsGrid}>
                                {(() => {
                                  const kPts = Math.round(map.kills * 3);
                                  const dPts = Math.round(map.deaths * -1);
                                  const aPts = Math.round(map.assists * 1.5);
                                  const cPts = Math.round(map.cs * 0.02);

                                  return (
                                    <>
                                      <View style={styles.statCard}>
                                        <View style={styles.statIconContainer}>
                                          <Swords size={16} color="#3B82F6" />
                                        </View>
                                        <Text style={styles.statLabel}>KILLS</Text>
                                        <Text style={styles.statValue}>{map.kills}</Text>
                                        <View style={kPts === 0 ? styles.statPointsBadgeGray : styles.statPointsBadgeGreen}>
                                          <Text style={kPts === 0 ? styles.statPointsTextGray : styles.statPointsTextGreen}>
                                            {kPts >= 0 ? `+${kPts}` : kPts}
                                          </Text>
                                        </View>
                                      </View>

                                      <View style={styles.statCard}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#EF444420' }]}>
                                          <Skull size={16} color="#EF4444" />
                                        </View>
                                        <Text style={styles.statLabel}>DEATHS</Text>
                                        <Text style={styles.statValue}>{map.deaths}</Text>
                                        <View style={dPts === 0 ? styles.statPointsBadgeGray : styles.statPointsBadgeRed}>
                                          <Text style={dPts === 0 ? styles.statPointsTextGray : styles.statPointsTextRed}>
                                            {dPts === 0 ? "0" : dPts}
                                          </Text>
                                        </View>
                                      </View>

                                      <View style={styles.statCard}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#10B98120' }]}>
                                          <Users size={16} color="#10B981" />
                                        </View>
                                        <Text style={styles.statLabel}>ASSISTS</Text>
                                        <Text style={styles.statValue}>{map.assists}</Text>
                                        <View style={aPts === 0 ? styles.statPointsBadgeGray : styles.statPointsBadgeGreen}>
                                          <Text style={aPts === 0 ? styles.statPointsTextGray : styles.statPointsTextGreen}>
                                            {aPts >= 0 ? `+${aPts}` : aPts}
                                          </Text>
                                        </View>
                                      </View>

                                      <View style={styles.statCard}>
                                        <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B20' }]}>
                                          <Wheat size={16} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.statLabel}>FARM (CS)</Text>
                                        <Text style={styles.statValue}>{map.cs}</Text>
                                        <View style={cPts === 0 ? styles.statPointsBadgeGray : styles.statPointsBadgeGreen}>
                                          <Text style={cPts === 0 ? styles.statPointsTextGray : styles.statPointsTextGreen}>
                                            {cPts >= 0 ? `+${cPts}` : cPts}
                                          </Text>
                                        </View>
                                      </View>
                                    </>
                                  );
                                })()}
                              </View>

                              {map.resultado === 'WIN' && (
                                <View style={styles.victoryBonusBanner}>
                                  <Text style={styles.victoryBonusText}>BONUS VICTORIA</Text>
                                  <Text style={styles.victoryBonusPoints}>+5 PTS</Text>
                                </View>
                              )}

                              <View style={styles.mapPointsFinal}>
                                <Text style={styles.mapPointsLabel}>PUNTUACIÓN FINAL MAPA</Text>
                                <View style={styles.pointsCircle}>
                                  <Text style={[styles.mapPointsValue, Math.round(map.puntosGenerados) < 0 && { color: '#EF4444' }]}>
                                    {Math.round(map.puntosGenerados)}
                                  </Text>
                                  <Text style={styles.ptsUnit}>PTS</Text>
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
          <View style={{ padding: 16 }}>
            <Text style={styles.sectionLabel}>PROMEDIOS DE TEMPORADA</Text>
            <View style={styles.statsList}>
              {[
                { label: 'Asesinatos', val: (estadisticas.reduce((acc, s) => acc + s.kills, 0) / estadisticas.length).toFixed(1) },
                { label: 'Muertes', val: (estadisticas.reduce((acc, s) => acc + s.deaths, 0) / estadisticas.length).toFixed(1) },
                { label: 'Asistencias', val: (estadisticas.reduce((acc, s) => acc + s.assists, 0) / estadisticas.length).toFixed(1) },
                { label: 'KDA', val: statsSummary.kda },
                { label: 'CS por Minuto', val: statsSummary.csMin },
                { label: 'Vision Score/Min', val: statsSummary.vision },
                { label: 'Daño Infligido (Prom)', val: '18.5k' },
                { label: 'Daño Mitigado (Prom)', val: '12.2k' },
                { label: 'Pentakills', val: '1' },
                { label: 'Total Victorias', val: estadisticas.filter(s => s.resultado === 'WIN').length, isLast: true },
              ].map((item, i) => (
                <View key={i} style={[styles.statRow, item.isLast && { borderBottomWidth: 0 }]}>
                  <Text style={styles.statRowLabel}>{item.label}</Text>
                  <Text style={styles.statRowValue}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loaderContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A' },
  backBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 12 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 16 },

  topTabBar: { flexDirection: 'row', backgroundColor: '#0F172A', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  topTabItem: { paddingVertical: 14, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: '#3B82F6' },
  topTabText: { color: '#64748B', fontSize: 13, fontWeight: 'bold' },
  topTabTextActive: { color: '#3B82F6' },

  heroSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#1E293B', margin: 16, borderRadius: 24 },
  avatar: { width: 80, height: 80, backgroundColor: '#3B82F6', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  playerName: { color: 'white', fontSize: 24, fontWeight: '900' },
  playerSub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  priceTag: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#10B98120', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  priceText: { color: '#10B981', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },

  sectionContainer: { marginTop: 24 },
  labelWithIcon: { flexDirection: 'row', alignItems: 'center', marginLeft: 4, marginBottom: 16 },
  sectionLabel: { color: '#64748B', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginLeft: 8 },

  graphCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20 },
  chartContainer: { height: 160, justifyContent: 'center', alignItems: 'center' },
  graphFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  footerStatItem: { alignItems: 'center' },
  footerStatLabel: { color: '#64748B', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  footerStatValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  radarCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, alignItems: 'center' },
  radarLegend: { flexDirection: 'row', marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { color: '#94A3B8', fontSize: 12 },

  weekTitleLabel: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 16 },
  serieCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginBottom: 16 },
  serieHeaderTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rivalText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  serieTotalPoints: { color: '#64748B', fontSize: 14, marginTop: 2 },
  resBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  winB: { backgroundColor: '#10B98120' },
  lossB: { backgroundColor: '#EF444420' },
  resText: { fontSize: 11, fontWeight: 'bold' },

  noPlayCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  noPlayText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },

  mapSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#0F172A', borderRadius: 12, padding: 4 },
  mapTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  mapTabActive: { backgroundColor: '#3B82F6' },
  mapTabText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  mapTabTextActive: { color: 'white' },

  mapDetailContainer: { backgroundColor: '#0F172A', borderRadius: 24, padding: 16 },
  modernStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { 
    width: '48%', 
    backgroundColor: '#1E293B', 
    borderRadius: 16, 
    padding: 12, 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  statIconContainer: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: '#3B82F620', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 8
  },
  statLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  statValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  
  statPointsBadgeGreen: { backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statPointsTextGreen: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
  
  statPointsBadgeRed: { backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statPointsTextRed: { color: '#EF4444', fontSize: 11, fontWeight: 'bold' },

  statPointsBadgeGray: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statPointsTextGray: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  victoryBonusBanner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#10B98115', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B98140'
  },
  victoryBonusText: { color: '#10B981', fontSize: 11, fontWeight: '900' },
  victoryBonusPoints: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },

  mapPointsFinal: { 
    alignItems: 'center', 
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  mapPointsLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  pointsCircle: { flexDirection: 'row', alignItems: 'baseline' },
  mapPointsValue: { color: '#3B82F6', fontSize: 36, fontWeight: '900' },
  ptsUnit: { color: '#3B82F6', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },

  statsList: { backgroundColor: '#1E293B', borderRadius: 24, paddingVertical: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  statRowLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  statRowValue: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});