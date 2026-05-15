import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, ImageBackground, StyleSheet, useWindowDimensions, DimensionValue, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useToast } from '../../../src/context/ToastContext';
import api from '../../../src/api/api';
import { EquipoDetalleDTO, JugadorEnPlantillaDTO } from '../../../src/types';
import { User, ArrowRightLeft, Shield, TrendingUp, Wallet, Map as MapIcon, Trash2, CircleDollarSign, Sword, Zap, Flame, Crosshair, LifeBuoy, Eye } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';
import RosterRevealModal from '../../../src/components/RosterRevealModal';
import { PlayerCard } from '../../../src/components/PlayerCard';

import MapaImage from '../../../assets/images/mapa.png';

import { useEquipo } from '../../../src/hooks/useEquipo';
import { ROLE_COORDINATES, ROLES_ORDEN } from '../../../src/constants/layout';

export default function MiEquipoScreen() {
  const router = useRouter();
  const { selectedLigaNombre, pendingReveal, setPendingReveal } = useAuthStore();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const [showReveal, setShowReveal] = useState(false);

  const MAP_SIZE = width;

  const {
    equipo,
    loading,
    refreshing,
    onRefresh,
    fetchEquipo,
    alinearJugador
  } = useEquipo();

  useFocusEffect(
    useCallback(() => {
      fetchEquipo(true);
    }, [fetchEquipo])
  );

  useEffect(() => {
    if (pendingReveal) {
      setShowReveal(true);
      setPendingReveal(false);
    }
  }, [pendingReveal]);

  const handleAlinear = async (jugadorId: number) => {
    if (!equipo?.equipoId) return;
    await alinearJugador(equipo.equipoId, jugadorId);
  };

  const handleVender = async (jugadorId: number, nickname: string) => {
    if (!equipo?.equipoId) return;

    Alert.alert(
      'Vender Jugador',
      `¿Estás seguro de que quieres vender a ${nickname}? Recuperarás su valor de mercado actual.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vender',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/mercado/vender', {
                equipoId: equipo.equipoId,
                jugadorId
              });
              showToast(response.data.message || 'Venta realizada con éxito', 'success');
              await fetchEquipo(true);
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
      <TouchableOpacity
        onPress={() => router.push(`/(main)/jugador/${jugador.idJugador}`)}
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
      <View className="flex-1 bg-surface/30 p-4 rounded-[28px] border border-dashed border-surface-light/20 flex-row items-center mb-4">
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

  const titulares = equipo?.jugadores?.filter(j => j.estado === 'TITULAR') || [];
  const suplentes = equipo?.jugadores?.filter(j => j.estado === 'BANQUILLO') || [];

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />

      <RosterRevealModal
        visible={showReveal}
        players={equipo?.jugadores || []}
        ligaNombre={selectedLigaNombre || 'la liga'}
        onClose={() => setShowReveal(false)}
      />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#00D1FF" />
          </View>
        ) : (
          <>
            <View className="px-4 py-6">
              <Text className="text-gray-500 font-bold text-xs uppercase tracking-[2px] mb-1">Mi Alineación</Text>
              <Text className="text-white font-black text-3xl tracking-tight">{equipo?.nombreEquipo}</Text>
            </View>

            <View className="flex-row px-4 mb-6">
              <View className="flex-1 bg-surface p-4 rounded-3xl border border-surface-light/20 mr-2">
                <View className="flex-row items-center mb-1">
                  <Wallet color="#00FF94" size={14} />
                  <Text className="text-gray-500 text-[9px] font-bold uppercase ml-1.5">Presupuesto</Text>
                </View>
                <Text className="text-neon-green text-lg font-black">{equipo?.presupuestoDisponible?.toLocaleString()} €</Text>
              </View>

              <View className="flex-1 bg-surface p-4 rounded-3xl border border-surface-light/20 ml-2 relative">
                <View className="flex-row items-center mb-1">
                  <TrendingUp color="#00D1FF" size={14} />
                  <Text className="text-gray-500 text-[9px] font-bold uppercase ml-1.5">Puntos</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-accent-cyan text-lg font-black">{Math.round(equipo?.puntuacionTotal ?? 0)} pts</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(main)/equipo-jornada/${equipo?.equipoId}`)}
                    className="w-8 h-8 bg-accent-cyan/10 rounded-xl items-center justify-center border border-accent-cyan/20"
                  >
                    <Eye color="#00D1FF" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

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

            <View className="bg-surface/50 rounded-t-[40px] px-6 pt-8 pb-32 border-t border-surface-light/20">
              <View className="flex-row items-center mb-6">
                <Shield color="#00D1FF" size={22} />
                <Text className="text-white text-2xl font-black ml-3">TITULARES</Text>
              </View>

              <View className="space-y-4">
                {ROLES_ORDEN.map(rol => {
                  const jugador = titulares.find(j => j.rol.toUpperCase() === rol.key);
                  return (
                    <View key={rol.key} className="flex-row items-center mb-3">
                      <View className="w-12 items-center justify-center mr-3">
                        <Text className="text-accent-cyan font-black text-[10px] uppercase italic -rotate-90" style={{ width: 60, textAlign: 'center' }}>
                          {rol.label}
                        </Text>
                      </View>
                      <View className="flex-1">
                        {jugador ? (
                          <PlayerCard
                            id={jugador.idJugador}
                            nickname={jugador.nickname}
                            equipoLec={jugador.equipoLec}
                            rol={jugador.rol}
                            imagenUrl={jugador.imagenUrl || undefined}
                            estado={jugador.estado}
                            onPressAction={() => handleAlinear(jugador.idJugador)}
                            actionLabel={jugador.estado === 'TITULAR' ? 'QUITAR' : 'PONER'}
                            hideBadge={true}
                            hideRole={true}
                            noMargin={true}
                          />
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
                suplentes.map(j => (
                  <PlayerCard
                    key={j.idJugador}
                    id={j.idJugador}
                    nickname={j.nickname}
                    equipoLec={j.equipoLec}
                    rol={j.rol}
                    imagenUrl={j.imagenUrl || undefined}
                    estado={j.estado}
                    onPressAction={() => handleAlinear(j.idJugador)}
                    actionLabel={j.estado === 'TITULAR' ? 'QUITAR' : 'PONER'}
                    showSellButton={j.estado === 'BANQUILLO'}
                    onSellPress={() => handleVender(j.idJugador, j.nickname)}
                  />
                ))
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
    transform: [{ translateX: -20 }, { translateY: -25 }],
  }
});
