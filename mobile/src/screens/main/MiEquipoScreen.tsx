import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import api from '../../api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../types';
import { User, ArrowRightLeft, Shield, TrendingUp, Wallet, Map as MapIcon } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';

const { width } = Dimensions.get('window');
const MAP_SIZE = width - 32;

const ROLE_COORDINATES: Record<string, { top: string, left: string }> = {
  'TOP': { top: '12%', left: '12%' },
  'JUNGLE': { top: '35%', left: '30%' },
  'MID': { top: '46%', left: '46%' },
  'ADC': { top: '82%', left: '78%' },
  'SUPPORT': { top: '72%', left: '84%' },
};

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

  const MinimapMarker = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => {
    const coords = ROLE_COORDINATES[jugador.rol.toUpperCase()] || { top: '0%', left: '0%' };
    
    return (
      <TouchableOpacity 
        style={[styles.marker, { top: coords.top, left: coords.left }]}
        onPress={() => navigation.navigate('JugadorDetail', { id: jugador.idJugador })}
      >
        <View className="items-center">
          <View className="w-10 h-10 rounded-full bg-midnight border-2 border-accent-cyan items-center justify-center shadow-lg shadow-accent-cyan/50">
             <User color="#00D1FF" size={20} />
          </View>
          <View className="bg-midnight/80 px-2 py-0.5 rounded-md mt-1 border border-accent-cyan/30">
            <Text className="text-white text-[9px] font-bold uppercase">{jugador.nickname}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const JugadorCard = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => (
    <TouchableOpacity 
      className={`bg-surface p-4 rounded-2xl mb-3 flex-row items-center border ${jugador.estado === 'TITULAR' ? 'border-accent-cyan/40 shadow-sm shadow-accent-cyan/10' : 'border-surface-light/20'}`}
      onPress={() => navigation.navigate('JugadorDetail', { id: jugador.idJugador })}
    >
      <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 border ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-midnight border-surface-light/30'}`}>
        <Text className={`font-black text-xs ${jugador.estado === 'TITULAR' ? 'text-accent-cyan' : 'text-gray-500'}`}>{jugador.rol.substring(0, 3).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-lg">{jugador.nickname}</Text>
        <View className="flex-row items-center">
          <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan' : 'bg-gray-600'}`} />
          <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{jugador.estado}</Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => handleAlinear(jugador.idJugador)} 
        className={`w-10 h-10 rounded-xl items-center justify-center ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan' : 'bg-surface-light/50'}`}
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
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchEquipo();}} tintColor="#00D1FF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="px-4 py-6">
           <Text className="text-gray-500 font-bold text-xs uppercase tracking-[2px] mb-1">Mi Alineación</Text>
           <Text className="text-white font-black text-3xl tracking-tight">{equipo?.nombreEquipo}</Text>
        </View>

        {/* Stats Cards */}
        <View className="flex-row px-4 mb-6">
          <View className="flex-1 bg-surface p-4 rounded-3xl border border-surface-light/20 mr-2">
            <View className="flex-row items-center mb-1">
              <Wallet color="#00FF94" size={14} />
              <Text className="text-gray-500 text-[9px] font-bold uppercase ml-1.5">Presupuesto</Text>
            </View>
            <Text className="text-neon-green text-lg font-black">{equipo?.presupuestoDisponible?.toLocaleString()} €</Text>
          </View>
          <View className="flex-1 bg-surface p-4 rounded-3xl border border-surface-light/20 ml-2">
            <View className="flex-row items-center mb-1">
              <TrendingUp color="#00D1FF" size={14} />
              <Text className="text-gray-500 text-[9px] font-bold uppercase ml-1.5">Puntos</Text>
            </View>
            <Text className="text-accent-cyan text-lg font-black">{Math.round(equipo?.puntuacionTotal ?? 0)} pts</Text>
          </View>
        </View>

        {/* Minimap Section */}
        <View className="px-4 mb-8">
          <View className="flex-row items-center justify-between mb-4">
             <View className="flex-row items-center">
                <MapIcon color="white" size={20} />
                <Text className="text-white text-xl font-black ml-2 italic">ESTRATEGIA</Text>
             </View>
             <View className="bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30">
                <Text className="text-accent-cyan text-[10px] font-black">{titulares.length}/5 TITULARES</Text>
             </View>
          </View>

          <View className="relative">
            <ImageBackground 
              source={require('../../../assets/images/MAPA-LOL.png')} 
              style={styles.mapContainer}
              imageStyle={{ borderRadius: 24, opacity: 0.8 }}
              className="border border-accent-cyan/20 rounded-[24px] overflow-hidden bg-surface shadow-2xl shadow-black"
            >
              {titulares.map(j => <MinimapMarker key={j.idJugador} jugador={j} />)}
              {titulares.length === 0 && (
                <View className="absolute inset-0 items-center justify-center bg-midnight/40 p-10">
                  <Text className="text-white font-bold text-center">Alinea a tus jugadores para verlos en el mapa</Text>
                </View>
              )}
            </ImageBackground>
          </View>
        </View>

        {/* Player Lists Section */}
        <View className="bg-surface/50 rounded-t-[40px] px-6 pt-8 pb-10 border-t border-surface-light/20">
          <View className="flex-row items-center mb-6">
            <Shield color="#00D1FF" size={22} />
            <Text className="text-white text-2xl font-black ml-3">TITULARES</Text>
          </View>
          
          {titulares.length > 0 ? (
            titulares.map(j => <JugadorCard key={j.idJugador} jugador={j} />)
          ) : (
            <View className="bg-midnight/30 p-8 rounded-2xl border border-dashed border-surface-light/30 items-center">
              <Text className="text-gray-500 italic text-center">No tienes titulares seleccionados</Text>
            </View>
          )}

          <View className="flex-row items-center mt-10 mb-6">
            <User color="#9CA3AF" size={22} />
            <Text className="text-white text-2xl font-black ml-3">BANQUILLO</Text>
          </View>
          
          {suplentes.length > 0 ? (
            suplentes.map(j => <JugadorCard key={j.idJugador} jugador={j} />)
          ) : (
            <View className="bg-midnight/30 p-8 rounded-2xl border border-dashed border-surface-light/30 items-center">
              <Text className="text-gray-500 italic text-center">Tu banquillo está vacío</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
  },
  marker: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -25 }], // Center the marker
  }
});
