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
        <Text style={styles.headerTitle}>Detalle</Text>
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
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>Historial</Text>
            </View>
            
            {weeks.map(week => {
              const weekStats = groupedStats[week];
              const totalWeekPoints = Object.values(weekStats).reduce((acc, seriesMaps) => {
                // Los puntos generados ya vienen como media en cada mapa del Bo3 si se llamó al motor
                // Si sumamos los de una serie (que son el mismo valor), tomamos el primero
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
                                {maps.map((map, midx) => (
                                  <View key={midx} style={styles.mapRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                      <View style={[styles.resultDot, { backgroundColor: map.resultado === 'WIN' ? '#10B981' : '#EF4444' }]} />
                                      <Text style={styles.mapText}>Partida {midx + 1} ({map.resultado})</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                      <Text style={styles.mapKda}>{map.kills}/{map.deaths}/{map.assists}</Text>
                                      <Text style={styles.mapBruto}>{(map.kills * 3 + map.assists * 1.5 - map.deaths + map.cs * 0.02).toFixed(1)}</Text>
                                    </View>
                                  </View>
                                ))}
                                <View style={styles.infoNote}>
                                  <Text style={styles.infoNoteText}>
                                    Total Serie: {maps.reduce((acc, m) => acc + (m.kills * 3 + m.assists * 1.5 - m.deaths + m.cs * 0.02), 0).toFixed(1)} ÷ {maps.length} mapas = {avgSerie.toFixed(1)} Pts
                                  </Text>
                                </View>
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

            {weeks.length === 0 && (
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                Sin estadísticas registradas aún.
              </Text>
            )}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  heroSection: { alignItems: 'center', padding: 40, backgroundColor: '#1E3A8A40', borderBottomWidth: 1, borderBottomColor: '#3B82F620' },
  avatar: { width: 120, height: 120, backgroundColor: '#1F2937', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#3B82F6', marginBottom: 16 },
  avatarText: { color: 'white', fontSize: 48, fontWeight: 'black' },
  playerName: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  teamBadge: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  teamText: { color: 'white', fontWeight: 'bold' },
  infoCard: { width: '48%', backgroundColor: '#1F2937', padding: 16, borderRadius: 24, marginBottom: 16 },
  infoLabel: { color: '#9CA3AF', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  infoValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  infoValueGreen: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  weekHeader: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeWeekHeader: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 1, borderBottomColor: '#374151' },
  weekTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  weekPointsBadge: { backgroundColor: '#3B82F620', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F640' },
  weekPointsText: { color: '#60A5FA', fontWeight: 'bold' },
  serieHeader: { backgroundColor: '#37415140', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  serieTitle: { color: '#D1D5DB', fontSize: 14, fontWeight: '600', flex: 1 },
  serieAvgText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
  mapsContainer: { backgroundColor: '#111827', padding: 8, borderRadius: 12, marginBottom: 8, marginTop: 2 },
  mapRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#1F2937' },
  resultDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  mapText: { color: '#9CA3AF', fontSize: 12 },
  mapKda: { color: '#6B7280', fontSize: 11 },
  mapBruto: { color: 'white', fontSize: 12, fontWeight: 'bold', minWidth: 30, textAlign: 'right' },
  infoNote: { padding: 8, marginTop: 4 },
  infoNoteText: { color: '#4B5563', fontSize: 10, fontStyle: 'italic', textAlign: 'center' }
});
