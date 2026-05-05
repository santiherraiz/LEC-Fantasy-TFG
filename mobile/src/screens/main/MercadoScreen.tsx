import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
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
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  const equiposEntries = Object.entries(equiposLec || {});

  return (
    <SafeAreaView className="flex-1 bg-midnight">
      <ScrollView 
        className="px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#00D1FF" />}
      >
        <Text className="text-white text-3xl font-bold tracking-tight mb-8 mt-4">Mercado</Text>
        
        {equiposEntries.map(([teamName, players]) => (
          <View key={teamName} className="mb-4 bg-surface rounded-2xl border border-surface-light/30 overflow-hidden">
            <TouchableOpacity 
              onPress={() => toggleTeam(teamName)} 
              className="p-5 flex-row justify-between items-center"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-midnight rounded-xl items-center justify-center mr-3 border border-surface-light/50">
                  {players[0]?.equipoLec?.logoUrl ? (
                    <Image source={{ uri: players[0].equipoLec.logoUrl }} className="w-7 h-7" resizeMode="contain" />
                  ) : (
                    <Text className="text-white font-bold">{teamName.substring(0, 1)}</Text>
                  )}
                </View>
                <Text className="text-white font-bold text-lg">{teamName}</Text>
              </View>
              {expandedTeam === teamName ? <ChevronDown color="#00D1FF" /> : <ChevronRight color="#4B5563" />}
            </TouchableOpacity>

            {expandedTeam === teamName && (
              <View className="px-4 pb-4">
                {(players || []).map((jugador, idx) => {
                  const isOwned = myPlayerIds.includes(jugador.id);
                  return (
                    <View key={jugador.id} className={`flex-row items-center py-4 ${idx !== 0 ? 'border-t border-surface-light/20' : ''}`}>
                      <TouchableOpacity 
                        className="flex-1" 
                        onPress={() => navigation.navigate('JugadorDetail', { id: jugador.id })}
                      >
                        <Text className="text-white font-bold text-base">{jugador.nickname}</Text>
                        <Text className="text-accent-cyan text-[10px] font-bold uppercase tracking-widest">{jugador.rol}</Text>
                      </TouchableOpacity>
                      
                      <View className="items-end mr-4">
                        <Text className="text-neon-green font-bold text-base">{jugador.precioBase?.toLocaleString()} €</Text>
                      </View>

                      {isOwned ? (
                        <TouchableOpacity 
                          onPress={() => handleVender(jugador.id)} 
                          className="bg-crimson/10 p-2 rounded-xl border border-crimson/30"
                        >
                          <Trash2 size={18} color="#FF003F" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => handleFichar(jugador.id)} 
                          className="bg-accent-cyan p-2 rounded-xl shadow-lg shadow-accent-cyan/20"
                        >
                          <ShoppingCart size={18} color="#0B0E14" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
