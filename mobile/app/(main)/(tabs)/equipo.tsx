import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, ImageBackground, StyleSheet, useWindowDimensions, DimensionValue, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useToast } from '../../../src/context/ToastContext';
import api from '../../../src/api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../../src/types';
import { User, ArrowRightLeft, Shield, TrendingUp, Wallet, Map as MapIcon, Trash2, CircleDollarSign, Sword, Zap, Flame, Crosshair, LifeBuoy } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

import MapaImage from '../../../assets/images/mapa.png';

const ROLE_COORDINATES: Record<string, { top: DimensionValue, left: DimensionValue }> = {
  'TOP': { top: '18%', left: '10%' },
  'JUNGLE': { top: '46%', left: '22%' },
  'MID': { top: '56%', left: '45%' },
  'BOT': { top: '83%', left: '67%' },
  'SUPPORT': { top: '88%', left: '82%' },
};

const ROLES_ORDEN = [
  { key: 'TOP', label: 'TOP' },
  { key: 'JUNGLE', label: 'JUNGLE' },
  { key: 'MID', label: 'MID' },
  { key: 'BOT', label: 'BOT' },
  { key: 'SUPPORT', label: 'SUPP' }
];

export default function MiEquipoScreen() {
  const router = useRouter();
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const [equipo, setEquipo] = useState<EquipoDetalleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const MAP_SIZE = width;

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

    const j = equipo?.jugadores.find(p => p.idJugador === jugadorId);
    if (j?.estado === 'TITULAR') {
      Alert.alert("Acción no permitida", "Debes mover al jugador al banquillo antes de venderlo.");
      return;
    }

    Alert.alert(
      "Vender Jugador",
      `¿Estás seguro de que quieres vender a ${nickname}? Recuperarás el 100% de su valor actual.`,
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
          style={StyleSheet.flatten([styles.marker, { top: coords.top, left: coords.left }])}
        >
          <View className="items-center">
            <View className="w-12 h-12 rounded-full bg-midnight border-2 border-accent-cyan items-center justify-center shadow-lg shadow-accent-cyan/50 overflow-hidden">
              {jugador.imagenUrl ? (
                <Image source={{ uri: jugador.imagenUrl }} className="w-12 h-12" style={{ marginTop: 6 }} resizeMode="contain" />
              ) : (
                <User color="#00D1FF" size={20} />
              )}
            </View>
            <View className="bg-midnight/80 px-2 py-0.5 rounded-md mt-1 border border-accent-cyan/30">
              <Text className="text-white text-[9px] font-bold uppercase">{jugador.nickname}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const EmptySlotCard = ({ label }: { label: string }) => {
    const getRoleIcon = () => {
      switch (label.toUpperCase()) {
        case 'TOP': return <Sword size={24} color="#4B5563" />;
        case 'JUNGLE': return <Zap size={24} color="#4B5563" />;
        case 'MID': return <Flame size={24} color="#4B5563" />;
        case 'BOT': case 'ADC': return <Crosshair size={24} color="#4B5563" />;
        case 'SUPP': case 'SUPPORT': return <LifeBuoy size={24} color="#4B5563" />;
        default: return <User size={24} color="#4B5563" />;
      }
    };

    return (
      <View className="flex-1 bg-surface/30 p-4 rounded-[28px] border border-dashed border-surface-light/20 flex-row items-center">
        <View className="w-14 h-14 rounded-2xl bg-midnight/40 items-center justify-center mr-4 border border-surface-light/10">
          {getRoleIcon()}
        </View>
        <View>
          <Text className="text-gray-500 font-black text-base italic uppercase tracking-tighter">POSICIÓN VACÍA</Text>
          <Text className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">Asigna un {label}</Text>
        </View>
      </View>
    );
  };

  const JugadorCard = ({ jugador, hideBadge = false, noMargin = false }: { jugador: JugadorEnPlantillaDTO, hideBadge?: boolean, noMargin?: boolean }) => (
    <Link href={`/jugador/${jugador.idJugador}`} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        className={`bg-surface p-3.5 rounded-[28px] flex-row items-center border ${noMargin ? '' : 'mb-4'} ${jugador.estado === 'TITULAR' ? 'border-accent-cyan/50 bg-accent-cyan/5 shadow-lg shadow-accent-cyan/20' : 'border-surface-light/30'}`}
      >
        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 border overflow-hidden relative ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-midnight border-surface-light/30'}`}>
          {jugador.imagenUrl ? (
            <Image
              source={{ uri: jugador.imagenUrl }}
              className="w-14 h-14"
              style={{ marginTop: 10 }}
              resizeMode="contain"
            />
          ) : (
            <Text className={`font-black text-xs ${jugador.estado === 'TITULAR' ? 'text-accent-cyan' : 'text-gray-500'}`}>
              {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol.toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          {jugador.nickname && (
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>{jugador.nickname}</Text>
            </View>
          )}
          {jugador.estado === 'BANQUILLO' && (
            <View className="flex-row items-center">
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPPORT' : jugador.rol.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          {jugador.estado === 'BANQUILLO' && (
            <TouchableOpacity
              onPress={() => handleVender(jugador.idJugador, jugador.nickname)}
              className="w-10 h-10 rounded-full items-center justify-center bg-rose-500/10 border border-rose-500/30 mr-3 shadow-sm shadow-rose-500/10"
            >
              <CircleDollarSign size={20} color="#FB7185" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleAlinear(jugador.idJugador)}
            className={`h-12 px-5 rounded-2xl items-center justify-center flex-row ${jugador.estado === 'TITULAR' ? 'bg-accent-cyan shadow-md shadow-accent-cyan/40' : 'bg-surface-light/50 border border-surface-light'}`}
          >
            <ArrowRightLeft size={18} color={jugador.estado === 'TITULAR' ? '#0B0E14' : 'white'} />
            <Text
              className={`ml-2 font-black text-[10px] tracking-widest ${jugador.estado === 'TITULAR' ? 'text-midnight' : 'text-white'}`}
            >
              {jugador.estado === 'TITULAR' ? 'QUITAR' : 'PONER'}
            </Text>
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
            <View className="mb-10">
              <View className="flex-row items-center justify-between mb-4 px-4">
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
                  style={{ width: MAP_SIZE * 0.9, height: MAP_SIZE * 0.9 }}
                  imageStyle={{
                    borderRadius: 32,
                    opacity: titulares.length === 0 ? 0.3 : 1,
                    transform: [{ scale: 1.05 }]
                  }}
                  resizeMode="cover"
                  className="border-2 border-accent-cyan/30 rounded-[32px] overflow-hidden shadow-2xl shadow-black bg-surface"
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
            <View className="bg-surface/50 rounded-t-[40px] px-6 pt-8 pb-32 border-t border-surface-light/20">
              <View className="flex-row items-center mb-6">
                <Shield color="#00D1FF" size={22} />
                <Text className="text-white text-2xl font-black ml-3">TITULARES</Text>
              </View>

              <View className="space-y-4">
                {ROLES_ORDEN.map(rol => {
                  const jugador = titulares.find(j => j.rol.toUpperCase() === rol.key);
                  return (
                    <View key={rol.key} className="flex-row items-center mb-5">
                      <View className="w-12 items-center justify-center mr-3">
                        <Text className="text-accent-cyan font-black text-[10px] uppercase italic -rotate-90" style={{ width: 60, textAlign: 'center' }}>
                          {rol.label}
                        </Text>
                      </View>
                      <View className="flex-1">
                        {jugador ? (
                          <JugadorCard jugador={jugador} hideBadge={true} noMargin={true} />
                        ) : (
                          <EmptySlotCard label={rol.label} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

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
