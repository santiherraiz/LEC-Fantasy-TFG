import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Polyline, Circle, Line, Polygon, G, Text as SvgText } from 'react-native-svg';
import api from '../../api/api';
import { Jugador, JugadorEstadistica } from '../../types';
import {
  ChevronLeft,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Swords,
  TrendingUp,
  Activity
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

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const [jugadorRes, statsRes] = await Promise.all([
          api.get(`/jugadores/${id}`),
          api.get(`/jugadores/${id}/estadisticas`)
        ]);
        setJugador(jugadorRes.data);
        setEstadisticas(statsRes.data);
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
  const maxWeek = statsWeeks.length > 0 ? Math.max(...statsWeeks) : 1;
  const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1).sort((a, b) => b - a);

  const weeklyData = statsWeeks.sort((a, b) => a - b).map(w => {
    const weekMatches = groupedStats[w];
    const seriesPoints = Object.values(weekMatches).map(maps => {
      return maps.reduce((acc, m) => acc + m.puntosGenerados, 0) / maps.length;
    });
    const totalWeek = seriesPoints.reduce((acc, p) => acc + p, 0);
    return Math.round(totalWeek);
  });

  const statsSummary = {
    kda: (estadisticas.reduce((acc, s) => acc + (s.kills + s.assists) / (s.deaths || 1), 0) / (estadisticas.length || 1)).toFixed(2),
    csMin: (estadisticas.reduce((acc, s) => acc + s.cs, 0) / (estadisticas.length * 30 || 1)).toFixed(1),
    avgPoints: (estadisticas.reduce((acc, s) => acc + s.puntosGenerados, 0) / (estadisticas.length || 1)).toFixed(0),
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
                  <Svg height="120" width={width - 72}>
                    <Line x1="0" y1="100" x2={width - 72} y2="100" stroke="#334155" strokeWidth="1" />
                    {weeklyData.map((d, i) => {
                      const x = (i / (weeklyData.length - 1 || 1)) * (width - 72);
                      const y = 100 - (d / Math.max(...weeklyData, 50)) * 80;
                      return (
                        <G key={i}>
                          {i > 0 && (
                            <Line
                              x1={((i - 1) / (weeklyData.length - 1)) * (width - 72)}
                              y1={100 - (weeklyData[i - 1] / Math.max(...weeklyData, 50)) * 80}
                              x2={x} y2={y} stroke="#3B82F6" strokeWidth="3"
                            />
                          )}
                          <Circle cx={x} cy={y} r="4" fill="#3B82F6" />
                          <SvgText x={x} y={y - 10} fill="#94A3B8" fontSize="10" textAnchor="middle">{d}</SvgText>
                          <SvgText x={x} y="115" fill="#64748B" fontSize="8" textAnchor="middle">S{statsWeeks.sort((a, b) => a - b)[i]}</SvgText>
                        </G>
                      );
                    })}
                  </Svg>
                </View>
                <View style={styles.graphFooter}>
                  <Text style={styles.graphStat}>MEDIA: {statsSummary.avgPoints} PTS</Text>
                  <Text style={styles.graphStat}>TOTAL J1-{maxWeek}: {Math.round(estadisticas.reduce((acc, s) => acc + s.puntosGenerados, 0))} PTS</Text>
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
                              <View style={styles.mapStatsGrid}>
                                <Text style={styles.fullStat}>Asesinatos: <Text style={styles.whiteStat}>{map.kills}</Text></Text>
                                <Text style={styles.fullStat}>Muertes: <Text style={styles.whiteStat}>{map.deaths}</Text></Text>
                                <Text style={styles.fullStat}>Asistencias: <Text style={styles.whiteStat}>{map.assists}</Text></Text>
                                <Text style={styles.fullStat}>Farmeo (CS): <Text style={styles.whiteStat}>{map.cs}</Text></Text>
                              </View>

                              <View style={styles.bonusRow}>
                                {map.resultado === 'WIN' && (
                                  <Text style={styles.bonusText}>Victoria: +5 pts</Text>
                                )}
                              </View>

                              <View style={styles.mapPointsFinal}>
                                <Text style={styles.mapPointsLabel}>PUNTOS MAPA</Text>
                                <Text style={[styles.mapPointsValue, Math.round(map.puntosGenerados) < 0 && { color: '#EF4444' }]}>{Math.round(map.puntosGenerados)} PTS</Text>
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
  chartContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  graphFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  graphStat: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

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

  mapDetailContainer: { backgroundColor: '#0F172A', borderRadius: 20, padding: 20 },
  mapStatsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  fullStat: { color: '#64748B', fontSize: 14, width: '100%', marginBottom: 8, fontWeight: '600' },
  whiteStat: { color: 'white', fontWeight: 'bold' },
  bonusRow: { marginTop: 8, marginBottom: 16 },
  bonusText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
  mapPointsFinal: { borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: 16, alignItems: 'center' },
  mapPointsLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  mapPointsValue: { color: '#3B82F6', fontSize: 28, fontWeight: '900' },

  statsList: { backgroundColor: '#1E293B', borderRadius: 24, paddingVertical: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  statRowLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  statRowValue: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});