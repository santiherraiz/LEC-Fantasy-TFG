import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Jugador, JugadorEstadistica } from '../../types';
import { ChevronLeft, Info, History, DollarSign, Trophy } from 'lucide-react-native';

export default function JugadorDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [estadisticas, setEstadisticas] = useState<JugadorEstadistica[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!jugador) return null;

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

          <View style={styles.totalPointsCard}>
            <View>
              <Text style={styles.pointsLabel}>NOMBRE REAL</Text>
              <Text style={styles.pointsValue}>{jugador.nombreReal}</Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <History color="white" size={20} />
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>Historial</Text>
            </View>
            
            {(estadisticas || []).map((stat, idx) => (
              <View key={idx} style={styles.statRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statName}>{stat.matchName || 'Partido'}</Text>
                  <Text style={styles.statSub}>Puntos Generados</Text>
                </View>
                <View style={styles.statPoints}>
                  <Text style={styles.statPointsText}>+{stat.puntosGenerados ?? 0}</Text>
                </View>
              </View>
            ))}
            {(estadisticas || []).length === 0 && (
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center' }}>Sin partidos registrados</Text>
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
  totalPointsCard: { backgroundColor: '#3B82F620', padding: 24, borderRadius: 24, borderSize: 1, borderColor: '#3B82F640', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { color: '#93C5FD', fontSize: 12, fontWeight: 'bold' },
  pointsValue: { color: 'white', fontSize: 24, fontWeight: '900' },
  statRow: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  statName: { color: 'white', fontWeight: 'bold' },
  statSub: { color: '#6B7280', fontSize: 12 },
  statPoints: { backgroundColor: '#3B82F620', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderSize: 1, borderColor: '#3B82F630' },
  statPointsText: { color: '#60A5FA', fontWeight: 'bold', fontSize: 18 }
});
