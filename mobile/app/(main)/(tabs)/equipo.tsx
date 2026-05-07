import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, ImageBackground, StyleSheet, useWindowDimensions, DimensionValue, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useToast } from '../../../src/context/ToastContext';
import api from '../../../src/api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../../src/types';
import { User, ArrowRightLeft, Shield, TrendingUp, Wallet, Map as MapIcon, Trash2 } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

import MapaImage from '../../../assets/images/mapa.png';

const ROLE_COORDINATES: Record<string, { top: DimensionValue, left: DimensionValue }> = {
  'TOP': { top: '12%', left: '12%' },
  'JUNGLE': { top: '35%', left: '30%' },
  'MID': { top: '46%', left: '46%' },
  'ADC': { top: '82%', left: '78%' },
  'SUPPORT': { top: '72%', left: '84%' },
};

export default function MiEquipoScreen() {
  const router = useRouter();
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const [equipo, setEquipo] = useState<EquipoDetalleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const MAP_SIZE = width - 32;

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

  const handleVender = async (jugadorId: number, nickname: string) => {
    if (!equipo?.equipoId) return;

    Alert.alert(
      "Vender Jugador",
      `¿Estás seguro de que quieres vender a ${nickname}? Se te devolverá el 100% de su valor.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Vender", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.post('/mercado/vender', {
                equipoId: equipo.equipoId,
                jugadorId
              });
              showToast(response.data, 'success');
              await fetchEquipo();
            } catch (error: any) {
              const errorData = error.response?.data;
              showToast(errorData?.message || 'Error al vender', 'error');
            }
          }
        }
      ]
    );
  };

  const MinimapMarker = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => {
    const role = jugador.rol.toUpperCase();
    const coords = ROLE_COORDINATES[role] || { top: '0%', left: '0%' };

    return (
      <Link href={`/jugador/${jugador.idJugador}`} asChild>
        <TouchableOpacity
          style={[styles.marker, { top: coords.top, left: coords.left }]}
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
      </Link>
    );
  };

  const JugadorCard = ({ jugador }: { jugador: JugadorEnPlantillaDTO }) => (
    <Link href={`/jugador/${jugador.idJugador}`} asChild>
      <TouchableOpacity
        className={`bg-surface p-4 rounded-2xl mb-3 flex-row items-center border ${jugador.estado === 'TITULAR' ? 'border-accent-cyan/40 shadow-sm shadow-accent-cyan/10' : 'border-surface-light/20'}`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 border ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-midnight border-surface-light/30'}`}>
          <Text className={`font-black text-xs ${jugador.estado === 'TITULAR' ? 'text-accent-cyan' : 'text-gray-500'}`}>
            {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol.toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">{jugador.nickname}</Text>
          <View className="flex-row items-center">
            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan' : 'bg-gray-600'}`} />
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{jugador.estado}</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => handleVender(jugador.idJugador, jugador.nickname)}
            className="w-10 h-10 rounded-xl items-center justify-center bg-crimson/10 border border-crimson/20 mr-2"
          >
            <Trash2 size={18} color="#FF003F" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAlinear(jugador.idJugador)}
            className={`w-10 h-10 rounded-xl items-center justify-center ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan' : 'bg-surface-light/50'}`}
          >
            <ArrowRightLeft size={18} color={jugador.estado === 'TITULAR' ? '#0B0E14' : 'white'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Link>
  );

  const titulares = equipo?.jugadores?.filter(j => j.estado === 'TITULAR') || [];
  const suplentes = equipo?.jugadores?.filter(j => j.estado === 'BANQUILLO') || [];

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEquipo(); }} tintColor="#00D1FF" />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#00D1FF" />
          </View>
        ) : (
          <>
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

              <View className="relative items-center">
                <ImageBackground
                  source={MapaImage}
                  style={{ width: MAP_SIZE, height: MAP_SIZE }}
                  imageStyle={{
                    borderRadius: 24,
                    opacity: titulares.length === 0 ? 0.3 : 1
                  }}
                  resizeMode="cover"
                  className="border border-accent-cyan/20 rounded-[24px] overflow-hidden shadow-2xl shadow-black bg-surface"
                >
                  {titulares.map(j => <MinimapMarker key={j.idJugador} jugador={j} />)}
                  {titulares.length === 0 && (
                    <View className="absolute inset-0 items-center justify-center bg-midnight/40 p-10">
                      <View className="bg-midnight/80 p-6 rounded-3xl border border-accent-cyan/30 items-center shadow-2xl">
                        <MapIcon color="#00D1FF" size={32} className="mb-3" />
                        <Text className="text-white font-black text-center text-lg italic">ESTRATEGIA BLOQUEADA</Text>
                        <Text className="text-gray-400 text-center text-xs mt-2 font-bold leading-5">Alinea a tus titulares para desbloquear el mapa táctico</Text>
                      </View>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -25 }], // Center the marker
  }
});
