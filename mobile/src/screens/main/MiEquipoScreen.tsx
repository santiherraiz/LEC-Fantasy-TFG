import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../types';
import { User, LogOut, ArrowRightLeft } from 'lucide-react-native';

export default function MiEquipoScreen() {
  const { user, logout } = useAuthStore();
  const [equipo, setEquipo] = useState<EquipoDetalleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipo = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/equipos/mi-equipo/${user.id}`);
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
  }, []);

  const handleAlinear = async (jugadorId: number) => {
    if (!equipo?.equipoId) {
      Alert.alert('Error', 'ID de equipo no encontrado');
      return;
    }
    
    try {
      const payload = { 
        equipoId: equipo.equipoId, 
        jugadorId 
      };
      const response = await api.put('/equipos/alinear', payload);
      // Si el backend devuelve un String plano en ResponseEntity.ok
      Alert.alert('Éxito', typeof response.data === 'string' ? response.data : 'Operación realizada');
      await fetchEquipo();
    } catch (error: any) {
      console.log("Error en alineación:", error.response?.data);
      // El backend devuelve ErrorResponse { message, details, timestamp }
      const errorData = error.response?.data;
      const msg = errorData?.message || 'No se pudo cambiar el estado de alineación';
      Alert.alert('Alineación Denegada', msg);
    }
  };

  const JugadorCard = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => (
    <View style={[styles.card, jugador.estado === 'TITULAR' ? styles.cardTitular : styles.cardSuplente]}>
      <View style={styles.posBadge}>
        <User color="#9CA3AF" size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName}>{jugador.nickname || 'Desconocido'}</Text>
        <Text style={styles.roleLabel}>{jugador.rol || 'LEC'}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{jugador.estado === 'TITULAR' ? 'TITULAR' : 'BANQUILLO'}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleAlinear(jugador.idJugador)} 
        style={styles.swapBtn}
      >
        <ArrowRightLeft size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const titulares = equipo?.jugadores?.filter(j => j.estado === 'TITULAR') || [];
  const suplentes = equipo?.jugadores?.filter(j => j.estado === 'BANQUILLO') || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.userIcon}><User color="white" size={20} /></View>
          <Text style={styles.userName}>{user?.nickname}</Text>
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
            <Text style={styles.statValueGreen}>
              {equipo?.presupuestoDisponible != null ? equipo.presupuestoDisponible.toLocaleString() : '0'} €
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValueBlue}>
              {equipo?.puntuacionTotal ?? 0} pts
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Titulares ({titulares.length}/5)</Text>
        {titulares.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        {titulares.length === 0 && <Text style={styles.emptyText}>Debes elegir a tus 5 titulares</Text>}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Banquillo ({suplentes.length})</Text>
        {suplentes.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        {suplentes.length === 0 && <Text style={styles.emptyText}>Banquillo vacío</Text>}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userIcon: { backgroundColor: '#2563EB', padding: 8, borderRadius: 999, marginRight: 12 },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, backgroundColor: '#1F2937', padding: 24, borderRadius: 24 },
  statLabel: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  statValueGreen: { color: '#10B981', fontSize: 24, fontWeight: 'bold' },
  statValueBlue: { color: '#3B82F6', fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  cardTitular: { borderColor: '#3B82F680' },
  cardSuplente: { borderColor: '#374151' },
  posBadge: { width: 48, height: 48, backgroundColor: '#111827', borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  playerName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  roleLabel: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  statusText: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' },
  swapBtn: { backgroundColor: '#2563EB', padding: 8, borderRadius: 999 },
  emptyText: { color: '#6B7280', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' }
});
