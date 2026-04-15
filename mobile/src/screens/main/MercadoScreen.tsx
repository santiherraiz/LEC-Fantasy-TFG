import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import api from '../../api/api';
import { Jugador, JugadorEnPlantillaDTO } from '../../types';
import { ChevronDown, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react-native';

export default function MercadoScreen({ navigation }: any) {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
  const [equiposLec, setEquiposLec] = useState<Record<string, Jugador[]>>({});
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myPlayerIds, setMyPlayerIds] = useState<number[]>([]);
  const [equipoId, setEquipoId] = useState<number | null>(null);

  const fetchData = async () => {
    if (!user?.id || !selectedLigaId) return;
    try {
      const [mercadoRes, miEquipoRes] = await Promise.all([
        api.get('/mercado/equipos-lec'),
        api.get(`/equipos/mi-equipo/${user.id}`, { params: { ligaId: selectedLigaId } })
      ]);
      
      setEquiposLec(mercadoRes.data || {});
      
      if (miEquipoRes.data) {
        setEquipoId(miEquipoRes.data.equipoId);
        if (miEquipoRes.data.jugadores) {
          setMyPlayerIds(miEquipoRes.data.jugadores.map((j: JugadorEnPlantillaDTO) => j.idJugador));
        }
      }
      
    } catch (error) {
      console.error("Error cargando mercado:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLigaId]);

  const handleFichar = async (jugadorId: number) => {
    try {
      const response = await api.post('/mercado/fichar', { 
        usuarioId: user?.id, 
        jugadorId,
        ligaId: selectedLigaId
      });
      showToast(typeof response.data === 'string' ? response.data : 'Jugador fichado', 'success');
      await fetchData();
    } catch (error: any) {
      const errorData = error.response?.data;
      showToast(errorData?.message || 'Error', 'error');
    }
  };

  const handleVender = async (jugadorId: number) => {
    if (!equipoId) return;
    try {
      const response = await api.post('/mercado/vender', { equipoId, jugadorId });
      showToast(typeof response.data === 'string' ? response.data : 'Jugador vendido', 'success');
      await fetchData();
    } catch (error: any) {
      const errorData = error.response?.data;
      showToast(errorData?.message || 'Error', 'error');
    }
  };

  const toggleTeam = (team: string) => {
    setExpandedTeam(expandedTeam === team ? null : team);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>
    );
  }

  const equiposEntries = Object.entries(equiposLec || {});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#3b82f6" />}
      >
        <Text style={styles.title}>Mercado</Text>
        
        {equiposEntries.map(([teamName, players]) => (
          <View key={teamName} style={styles.teamCard}>
            <TouchableOpacity onPress={() => toggleTeam(teamName)} style={styles.teamHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.teamIcon}><Text style={styles.teamIconText}>{teamName.substring(0, 1)}</Text></View>
                <Text style={styles.teamNameText}>{teamName}</Text>
              </View>
              {expandedTeam === teamName ? <ChevronDown color="white" /> : <ChevronRight color="white" />}
            </TouchableOpacity>

            {expandedTeam === teamName && (
              <View style={styles.playersList}>
                {(players || []).map(jugador => {
                  const isOwned = myPlayerIds.includes(jugador.id);
                  return (
                    <View key={jugador.id} style={styles.playerRow}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('JugadorDetail', { id: jugador.id })}>
                        <Text style={styles.playerName}>{jugador.nickname}</Text>
                        <Text style={styles.playerPos}>{jugador.rol}</Text>
                      </TouchableOpacity>
                      <View style={{ alignItems: 'flex-end', marginRight: 16 }}>
                        <Text style={styles.playerPrice}>{jugador.precioBase?.toLocaleString()} €</Text>
                      </View>
                      {isOwned ? (
                        <TouchableOpacity onPress={() => handleVender(jugador.id)} style={styles.sellBtn}>
                          <Trash2 size={18} color="#F87171" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => handleFichar(jugador.id)} style={styles.buyBtn}>
                          <ShoppingCart size={18} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  teamCard: { marginBottom: 16, backgroundColor: '#1F2937', borderRadius: 16, overflow: 'hidden' },
  teamHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamIcon: { width: 40, height: 40, backgroundColor: '#374151', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teamIconText: { color: 'white', fontWeight: 'bold' },
  teamNameText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  playersList: { paddingHorizontal: 16, paddingBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#374151' },
  playerName: { color: 'white', fontWeight: 'bold' },
  playerPos: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  playerPrice: { color: '#10B981', fontWeight: 'bold' },
  sellBtn: { backgroundColor: '#7F1D1D40', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EF444450' },
  buyBtn: { backgroundColor: '#2563EB', padding: 8, borderRadius: 8 }
});
