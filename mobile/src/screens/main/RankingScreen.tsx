import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { RankingEntry } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Trophy, Medal } from 'lucide-react-native';

export default function RankingScreen() {
  const { selectedLigaId } = useAuthStore();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    if (!selectedLigaId) return;
    try {
      const response = await api.get('/equipos/ranking', {
        params: { ligaId: selectedLigaId }
      });
      setRanking(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [selectedLigaId]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy color="#eab308" size={24} />;
    if (index === 1) return <Medal color="#94a3b8" size={24} />;
    if (index === 2) return <Medal color="#92400e" size={24} />;
    return <Text style={styles.rankNumber}>{index + 1}</Text>;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>
    );
  }

  const safeRanking = ranking || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchRanking();}} tintColor="#3b82f6" />}
      >
        <Text style={styles.title}>Ranking de la Liga</Text>
        
        <View>
          {safeRanking.map((entry, index) => (
            <View 
              key={entry.equipoId ? entry.equipoId.toString() : `rank-${index}`} 
              style={[styles.rankCard, index < 3 && styles.topRankCard]}
            >
              <View style={styles.iconContainer}>{getRankIcon(index)}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{entry.nombreUsuario || 'Usuario'}</Text>
                <Text style={styles.userSub}>ENTRENADOR</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.pointsValue}>{entry.puntosTotales ?? 0}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
              </View>
            </View>
          ))}
          {safeRanking.length === 0 && !loading && (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No hay datos en esta liga.</Text></View>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  rankCard: { backgroundColor: '#1F2937', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  topRankCard: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  iconContainer: { marginRight: 16, width: 32, alignItems: 'center' },
  rankNumber: { color: '#6B7280', fontWeight: 'bold', fontSize: 16 },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  userSub: { color: '#6B7280', fontSize: 10, letterSpacing: 1 },
  pointsValue: { color: '#3B82F6', fontWeight: '900', fontSize: 20 },
  pointsLabel: { color: '#6B7280', fontSize: 10 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' }
});
