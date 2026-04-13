import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Jugador, JugadorEstadistica } from '../../types';
import { ChevronLeft, Info, History, DollarSign, ChevronDown, ChevronRight, Swords } from 'lucide-react-native';

export default function JugadorDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [estadisticas, setEstadisticas] = useState<JugadorEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
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

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => ({ ...prev, [week]: !prev[week] }));
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

  // Agrupar por semana y serie
  const groupedStats: Record<number, Record<string, JugadorEstadistica[]>> = {};
  estadisticas.forEach(stat => {
    const w = stat.semana || 1;
    const s = stat.serieId || `GAME_${stat.gameId}`;
    if (!groupedStats[w]) groupedStats[w] = {};
    if (!groupedStats[w][s]) groupedStats[w][s] = [];
    groupedStats[w][s].push(stat);
  });

  const weeks = Object.keys(groupedStats).map(Number).sort((a, b) => b - a);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Jugador</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{jugador.nickname ? jugador.nickname.substring(0, 1) : '?'}</Text>
          </View>
          <Text style={styles.playerName}>{jugador.nickname}</Text>
          <View style={styles.teamBadge}><Text style={styles.teamText}>{jugador.equipoLec}</Text></View>
        </View>

        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={styles.infoCard}>
              <Info size={16} color="#9CA3AF" />
              <Text style={styles.infoLabel}>ROL</Text>
              <Text style={styles.infoValue}>{jugador.rol}</Text>
            </View>
            <View style={styles.infoCard}>
              <DollarSign size={16} color="#9CA3AF" />
              <Text style={styles.infoLabel}>PRECIO</Text>
              <Text style={styles.infoValueGreen}>
                {jugador.precioBase != null ? jugador.precioBase.toLocaleString() : '0'} €
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <History color="white" size={20} />
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>Historial de Puntos</Text>
            </View>
            
            {weeks.map(week => {
              const weekStats = groupedStats[week];
              const totalWeekPoints = Object.values(weekStats).reduce((acc, seriesMaps) => {
                return acc + (seriesMaps[0].puntosGenerados || 0);
              }, 0);

              return (
                <View key={week} style={{ marginBottom: 16 }}>
                  <TouchableOpacity 
                    onPress={() => toggleWeek(week)}
                    style={[styles.weekHeader, expandedWeeks[week] && styles.activeWeekHeader]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {expandedWeeks[week] ? <ChevronDown color="#60A5FA" size={20} /> : <ChevronRight color="#9CA3AF" size={20} />}
                      <Text style={styles.weekTitle}>SEMANA {week}</Text>
                    </View>
                    <View style={styles.weekPointsBadge}>
                      <Text style={styles.weekPointsText}>{totalWeekPoints.toFixed(1)} Pts</Text>
                    </View>
                  </TouchableOpacity>

                  {expandedWeeks[week] && (
                    <View style={{ marginTop: 8, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#374151' }}>
                      {Object.keys(weekStats).map(serieId => {
                        const maps = weekStats[serieId];
                        const avgSerie = maps[0].puntosGenerados || 0;
                        const matchName = maps[0].matchName || 'Partido';
                        
                        return (
                          <View key={serieId} style={{ marginBottom: 8 }}>
                            <TouchableOpacity 
                              onPress={() => toggleSerie(serieId)}
                              style={styles.serieHeader}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {expandedSeries[serieId] ? <ChevronDown color="#93C5FD" size={16} /> : <ChevronRight color="#9CA3AF" size={16} />}
                                <Swords color="#60A5FA" size={14} style={{ marginHorizontal: 6 }} />
                                <Text style={styles.serieTitle} numberOfLines={1}>{matchName}</Text>
                              </View>
                              <Text style={styles.serieAvgText}>Media: {avgSerie.toFixed(1)}</Text>
                            </TouchableOpacity>

                            {expandedSeries[serieId] && (
                              <View style={styles.mapsContainer}>
                                {maps.map((map, idx) => (
                                  <View key={idx} style={styles.mapCard}>
                                    <View style={styles.mapHeader}>
                                      <Text style={styles.mapName}>MAPA {idx + 1}</Text>
                                      <View style={[styles.resultBadge, map.resultado === 'WIN' ? styles.winBadge : styles.lossBadge]}>
                                        <Text style={styles.resultText}>{map.resultado}</Text>
                                      </View>
                                    </View>
                                    
                                    <View style={styles.statsGrid}>
                                      <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>KILLS</Text>
                                        <Text style={styles.statValue}>{map.kills}</Text>
                                        <Text style={styles.statPts}>(+{(map.kills * 3).toFixed(1)} pts)</Text>
                                      </View>
                                      <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>DEATHS</Text>
                                        <Text style={styles.statValue}>{map.deaths}</Text>
                                        <Text style={[styles.statPts, { color: '#EF4444' }]}>( -{(map.deaths * 1).toFixed(1)} pts)</Text>
                                      </View>
                                      <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>ASSISTS</Text>
                                        <Text style={styles.statValue}>{map.assists}</Text>
                                        <Text style={styles.statPts}>(+{(map.assists * 1.5).toFixed(1)} pts)</Text>
                                      </View>
                                      <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>CS</Text>
                                        <Text style={styles.statValue}>{map.cs}</Text>
                                        <Text style={styles.statPts}>(+{(map.cs * 0.02).toFixed(1)} pts)</Text>
                                      </View>
                                    </View>

                                    <View style={styles.totalMapPoints}>
                                      <Text style={styles.totalLabel}>TOTAL MAPA:</Text>
                                      <Text style={styles.totalValue}>{map.puntosGenerados.toFixed(1)} PTS</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, backgroundColor: '#1F2937', borderRadius: 12 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  heroSection: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#1F2937', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  avatar: { width: 100, height: 100, backgroundColor: '#3B82F6', borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: '#1F2937' },
  avatarText: { color: 'white', fontSize: 48, fontWeight: 'bold' },
  playerName: { color: 'white', fontSize: 32, fontWeight: '900' },
  teamBadge: { marginTop: 8, backgroundColor: '#1E40AF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  teamText: { color: '#BFDBFE', fontSize: 14, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#1F2937', padding: 20, borderRadius: 24, width: '48%', alignItems: 'center' },
  infoLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', marginTop: 8 },
  infoValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  infoValueGreen: { color: '#10B981', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1F2937', borderRadius: 16, marginBottom: 8 },
  activeWeekHeader: { backgroundColor: '#374151' },
  weekTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  weekPointsBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  weekPointsText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  serieHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4 },
  serieTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600', flex: 1 },
  serieAvgText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
  mapsContainer: { paddingVertical: 8, marginBottom: 12 },
  mapCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mapName: { color: '#60A5FA', fontWeight: 'bold', fontSize: 12 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  winBadge: { backgroundColor: '#10B98140' },
  lossBadge: { backgroundColor: '#EF444440' },
  resultText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: '48%', marginBottom: 12 },
  statLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statPts: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
  totalMapPoints: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
  totalValue: { color: '#3B82F6', fontSize: 18, fontWeight: 'bold' }
});
