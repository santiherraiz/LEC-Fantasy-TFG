import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../types';
import { User, LogOut, ArrowRightLeft, ChevronLeft } from 'lucide-react-native';

export default function MiEquipoScreen() {
  const { user, logout, selectedLigaId, setSelectedLiga } = useAuthStore();
  const [equipo, setEquipo] = useState<EquipoDetalleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipo = async () => {
    if (!user || !selectedLigaId) return;
    try {
      const response = await api.get(`/equipos/mi-equipo/${user.id}`, {
        params: { ligaId: selectedLigaId }
      });
      setEquipo(response.data);
    } catch (error) {
      console.error("Error al cargar equipo:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [selectedLigaId]);

  const handleAlinear = async (jugadorId: number) => {
    if (!equipo?.equipoId) return;
    
    try {
      const response = await api.put('/equipos/alinear', { 
        equipoId: equipo.equipoId, 
        jugadorId 
      });
      Alert.alert('Éxito', typeof response.data === 'string' ? response.data : 'Operación realizada');
      await fetchEquipo();
    } catch (error: any) {
      const errorData = error.response?.data;
      Alert.alert('Alineación Denegada', errorData?.message || 'Error');
    }
  };

  const JugadorCard = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => (
    <View style={[styles.card, jugador.estado === 'TITULAR' ? styles.cardTitular : styles.cardSuplente]}>
      <View style={styles.posBadge}><User color="#9CA3AF" size={24} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName}>{jugador.nickname}</Text>
        <Text style={styles.roleLabel}>{jugador.rol}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{jugador.estado}</Text>
      </View>
      <TouchableOpacity onPress={() => handleAlinear(jugador.idJugador)} style={styles.swapBtn}>
        <ArrowRightLeft size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
    );
  }

  const titulares = equipo?.jugadores?.filter(j => j.estado === 'TITULAR') || [];
  const suplentes = equipo?.jugadores?.filter(j => j.estado === 'BANQUILLO') || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedLiga(null)} style={{ padding: 8 }}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.userName}>{user?.nickname}</Text>
          <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: 'bold' }}>{equipo?.nombreEquipo}</Text>
        </View>
        <TouchableOpacity onPress={logout}><LogOut color="#EF4444" size={24} /></TouchableOpacity>
      </View>

      <ScrollView 
        style={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchEquipo();}} />}
      >
        <View style={styles.statsContainer}>
          <View>
            <Text style={styles.statLabel}>Presupuesto</Text>
            <Text style={styles.statValueGreen}>{equipo?.presupuestoDisponible?.toLocaleString()} €</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValueBlue}>{equipo?.puntuacionTotal ?? 0} pts</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Titulares ({titulares.length}/5)</Text>
        {titulares.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        {titulares.length === 0 && <Text style={styles.emptyText}>Debes elegir a tus 5 titulares</Text>}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Banquillo ({suplentes.length})</Text>
        {suplentes.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20, backgroundColor: '#1F2937', padding: 24, borderRadius: 24 },
  statLabel: { color: '#9CA3AF', fontSize: 12 },
  statValueGreen: { color: '#10B981', fontSize: 24, fontWeight: 'bold' },
  statValueBlue: { color: '#3B82F6', fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardTitular: { borderColor: '#3B82F640', borderWidth: 1 },
  cardSuplente: { borderColor: 'transparent' },
  posBadge: { width: 44, height: 44, backgroundColor: '#111827', borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playerName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  roleLabel: { color: '#3B82F6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#374151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 10 },
  statusText: { color: '#9CA3AF', fontSize: 9, fontWeight: 'bold' },
  swapBtn: { backgroundColor: '#2563EB', padding: 8, borderRadius: 999 },
  emptyText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }
});
