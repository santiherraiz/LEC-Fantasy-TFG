import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import api from '../../api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../types';
import { User, ArrowRightLeft } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';

export default function MiEquipoScreen({ navigation }: any) {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
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

  useFocusEffect(
    useCallback(() => {
      fetchEquipo();
    }, [selectedLigaId])
  );

  const handleAlinear = async (jugadorId: number) => {
    if (!equipo?.equipoId) return;
    
    try {
      const response = await api.put('/equipos/alinear', { 
        equipoId: equipo.equipoId, 
        jugadorId 
      });
      showToast(typeof response.data === 'string' ? response.data : 'Operación realizada', 'success');
      await fetchEquipo();
    } catch (error: any) {
      const errorData = error.response?.data;
      showToast(errorData?.message || 'Error', 'error');
    }
  };

  const JugadorCard = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => (
    <TouchableOpacity 
      className={`bg-surface p-4 rounded-2xl mb-3 flex-row items-center border ${jugador.estado === 'TITULAR' ? 'border-accent-cyan/50 shadow-lg shadow-accent-cyan/20' : 'border-surface-light/30'}`}
      onPress={() => navigation.navigate('JugadorDetail', { id: jugador.idJugador })}
    >
      <View className="w-11 h-11 bg-midnight rounded-full items-center justify-center mr-3 border border-surface-light/50">
        <User color={jugador.estado === 'TITULAR' ? '#00D1FF' : '#4B5563'} size={24} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-lg">{jugador.nickname}</Text>
        <Text className="text-accent-cyan text-[10px] font-bold uppercase tracking-widest">{jugador.rol}</Text>
      </View>
      <View className="bg-surface-light/50 px-2 py-1 rounded-md mr-3">
        <Text className="text-gray-400 text-[8px] font-bold uppercase">{jugador.estado}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleAlinear(jugador.idJugador)} 
        className={`p-2 rounded-full ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan' : 'bg-surface-light'}`}
      >
        <ArrowRightLeft size={18} color={jugador.estado === 'TITULAR' ? '#0B0E14' : 'white'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  const titulares = equipo?.jugadores?.filter(j => j.estado === 'TITULAR') || [];
  const suplentes = equipo?.jugadores?.filter(j => j.estado === 'BANQUILLO') || [];

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />

      <ScrollView 
        className="px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchEquipo();}} tintColor="#00D1FF" />}
      >
        <View className="my-6">
           <Text className="text-white font-bold text-3xl tracking-tight">{user?.nickname}</Text>
           <Text className="text-accent-cyan font-medium text-sm">{equipo?.nombreEquipo}</Text>
        </View>

        <View className="flex-row justify-between mb-8 bg-surface p-6 rounded-3xl border border-surface-light/30 shadow-2xl">
          <View>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter mb-1">Presupuesto</Text>
            <Text className="text-neon-green text-2xl font-bold">{equipo?.presupuestoDisponible?.toLocaleString()} €</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter mb-1">Puntuación</Text>
            <Text className="text-accent-cyan text-2xl font-bold">{Math.round(equipo?.puntuacionTotal ?? 0)} pts</Text>
          </View>
        </View>

        <View className="flex-row items-baseline mb-4">
          <Text className="text-white text-xl font-bold">Titulares</Text>
          <Text className="text-gray-500 text-sm font-bold ml-2">({titulares.length}/5)</Text>
        </View>
        
        {titulares.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        {titulares.length === 0 && <Text className="text-gray-600 italic text-center my-4">No tienes titulares seleccionados</Text>}

        <View className="flex-row items-baseline mt-4 mb-4">
          <Text className="text-white text-xl font-bold">Banquillo</Text>
          <Text className="text-gray-500 text-sm font-bold ml-2">({suplentes.length})</Text>
        </View>
        
        {suplentes.map(j => <JugadorCard key={j.idJugador} jugador={j} />)}
        
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
