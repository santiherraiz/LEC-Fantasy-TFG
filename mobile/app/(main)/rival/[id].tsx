import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, RefreshControl, ImageBackground, StyleSheet, DimensionValue } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap,
  User,
  ChevronUp,
  ChevronDown,
  Users,
  Shield,
  TrendingUp,
  Map as MapIcon,
  Wallet
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn
} from 'react-native-reanimated';
import api from '../../../src/api/api';
import { EquipoRivalDTO, JugadorRival } from '../../../src/types';
import { useAuthStore } from '../../../src/store/authStore';
import { useToast } from '../../../src/context/ToastContext';
import CustomHeader from '../../../src/components/CustomHeader';
import MapaImage from '../../../assets/images/mapa.png';

const { width } = Dimensions.get('window');
const MAP_SIZE = width;

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

export default function RivalTeamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [equipo, setEquipo] = useState<EquipoRivalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEquipoRival();
  }, [id]);

  const fetchEquipoRival = async () => {
    try {
      const response = await api.get(`/equipos/rival/${id}`);
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching rival team:', error);
      showToast('Error al cargar el equipo rival', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClausulazo = async (jugadorId: number, nickname: string, precioBase: number, precioActual: number) => {
    const { user, selectedLigaId } = useAuthStore.getState();
    if (!user || !selectedLigaId) return;

    const precioFinal = precioActual || precioBase;
    const precioClausula = precioFinal * 1.5;

    Alert.alert(
      '¡CLAUSULAZO!',
      `¿Estás seguro de que quieres pagar la cláusula de ${nickname} por ${precioClausula.toLocaleString()} €?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'PAGAR CLÁUSULA',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/mercado/clausulazo', {
                compradorUsuarioId: user.id,
                jugadorId: jugadorId,
                ligaId: selectedLigaId
              });

              showToast(`¡Has robado a ${nickname} con éxito!`, 'success');
              fetchEquipoRival();
            } catch (error: any) {
              showToast(error.response?.data?.message || 'No se pudo ejecutar el clausulazo', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!equipo) return null;

  const titulares = equipo.jugadores.filter(j => j.estado === 'TITULAR');
  const banquillo = equipo.jugadores.filter(j => j.estado === 'BANQUILLO');
  const valorPlantilla = equipo.jugadores.reduce((acc, j) => acc + (j.precioActual || j.precioBase), 0);

  const MinimapMarker = ({ jugador }: { jugador: JugadorRival }) => {
    const role = jugador.rol.toUpperCase();
    const coords = ROLE_COORDINATES[role] || { top: '0%', left: '0%' };

    return (
      <View style={StyleSheet.flatten([styles.marker, { top: coords.top, left: coords.left }])}>
        <View className="items-center">
          <View className="w-12 h-12 rounded-full bg-midnight border-2 border-accent-cyan items-center justify-center shadow-lg shadow-accent-cyan/50 overflow-hidden">
            {jugador.foto ? (
              <Image source={{ uri: jugador.foto }} className="w-12 h-12" style={{ marginTop: 6 }} resizeMode="contain" />
            ) : (
              <User color="#00D1FF" size={20} />
            )}
          </View>
          <View className="bg-midnight/80 px-2 py-0.5 rounded-md mt-1 border border-accent-cyan/30">
            <Text className="text-white text-[9px] font-bold uppercase">{jugador.nickname}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader title="Equipo Rival" showBackButton />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEquipoRival(); }} tintColor="#00D1FF" />}
      >
        {/* Header Hero */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="px-6 pt-8 pb-6"
        >
          <View className="flex-row items-center mb-6">
            <View className="w-20 h-20 bg-surface rounded-[32px] items-center justify-center border-2 border-accent-cyan/20 shadow-xl shadow-accent-cyan/10">
              <User color="#00D1FF" size={40} />
            </View>
            <View className="ml-6 flex-1">
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-1">Manager de la Liga</Text>
              <Text className="text-white font-black text-4xl italic uppercase tracking-tighter leading-none" numberOfLines={1}>
                {equipo.nombreUsuario}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-surface/80 p-5 rounded-[32px] border border-surface-light/20">
              <View className="flex-row items-center mb-2">
                <TrendingUp color="#00D1FF" size={14} />
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-2">Puntos Totales</Text>
              </View>
              <View className="flex-row items-end">
                <Text className="text-white text-3xl font-black italic">{Math.round(equipo.puntosTotales)}</Text>
                <Text className="text-accent-cyan font-black mb-1 ml-1.5 text-[10px]">PTS</Text>
              </View>
            </View>
            <View className="flex-1 bg-surface/80 p-5 rounded-[32px] border border-surface-light/20">
              <View className="flex-row items-center mb-2">
                <Wallet color="#39FF14" size={14} />
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-2">Valor Plantilla</Text>
              </View>
              <Text className="text-white text-xl font-black tracking-tight">{valorPlantilla.toLocaleString()} €</Text>
            </View>
          </View>
        </Animated.View>

        {/* Strategy Map Section */}
        <Animated.View entering={FadeIn.delay(200)} className="mb-10 px-4">
          <View className="flex-row items-center justify-between mb-6 px-2">
            <View className="flex-row items-center">
              <MapIcon color="white" size={20} />
              <Text className="text-white text-xl font-black ml-3 italic uppercase tracking-tighter">Esquema Táctico</Text>
            </View>
            <View className="bg-accent-cyan/10 px-4 py-1.5 rounded-full border border-accent-cyan/30 shadow-sm">
              <Text className="text-accent-cyan text-[10px] font-black uppercase tracking-widest">{titulares.length}/5 TITULARES</Text>
            </View>
          </View>

          <View className="relative items-center">
            <ImageBackground
              source={MapaImage}
              style={{ width: MAP_SIZE * 0.9, height: MAP_SIZE * 0.9 }}
              imageStyle={{
                borderRadius: 40,
                opacity: titulares.length === 0 ? 0.3 : 1,
              }}
              resizeMode="cover"
              className="border-2 border-surface-light/30 rounded-[40px] overflow-hidden shadow-2xl shadow-black bg-surface"
            >
              {titulares.map(j => <MinimapMarker key={j.id} jugador={j} />)}
              {titulares.length === 0 && (
                <View className="absolute inset-0 items-center justify-center p-10 bg-midnight/40">
                  <Text className="text-gray-500 font-black text-center text-sm uppercase italic tracking-widest">Sin alineación confirmada</Text>
                </View>
              )}
            </ImageBackground>
          </View>
        </Animated.View>

        {/* Player Lists Section */}
        <View className="bg-surface/50 rounded-t-[48px] px-6 pt-10 pb-32 border-t border-surface-light/20">
          <View className="flex-row items-center mb-8">
            <Shield color="#00D1FF" size={24} />
            <Text className="text-white text-2xl font-black ml-4 tracking-tight">ROSTER INICIAL</Text>
          </View>

          <View className="space-y-6">
            {ROLES_ORDEN.map((rol, idx) => {
              const jugador = titulares.find(j => j.rol.toUpperCase() === rol.key);
              return (
                <Animated.View key={rol.key} entering={FadeInRight.delay(idx * 100)}>
                  <View className="flex-row items-center mb-6">
                    <View className="w-12 items-center justify-center mr-3">
                      <Text className="text-accent-cyan font-black text-[10px] uppercase italic -rotate-90" style={{ width: 60, textAlign: 'center' }}>
                        {rol.label}
                      </Text>
                    </View>
                    <View className="flex-1">
                      {jugador ? (
                        <JugadorRivalCard jugador={jugador} onClausulazo={handleClausulazo} noMargin />
                      ) : (
                        <View className="flex-1 bg-midnight/30 p-5 rounded-[28px] border border-dashed border-surface-light/20 items-center justify-center">
                          <Text className="text-gray-600 font-black text-[10px] uppercase tracking-widest italic">Posición Vacía</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <View className="flex-row items-center mt-12 mb-8">
            <Users color="#9CA3AF" size={24} />
            <Text className="text-white text-2xl font-black ml-4 tracking-tight">BANQUILLO</Text>
          </View>

          {banquillo.length > 0 ? (
            banquillo.map((j, idx) => (
              <Animated.View key={j.id} entering={FadeInRight.delay((idx + 5) * 100)}>
                <JugadorRivalCard jugador={j} onClausulazo={handleClausulazo} />
              </Animated.View>
            ))
          ) : (
            <View className="bg-midnight/30 p-10 rounded-[32px] border border-dashed border-surface-light/20 items-center">
              <Text className="text-gray-500 italic font-medium">No hay reservas en este equipo</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function JugadorRivalCard({ jugador, onClausulazo, noMargin }: { jugador: JugadorRival, onClausulazo: (id: number, nick: string, precioBase: number, precioActual: number) => void, noMargin?: boolean }) {
  const router = useRouter();
  const precio = jugador.precioActual || jugador.precioBase;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/jugador/${jugador.id}`)}
      activeOpacity={0.9}
      className={`bg-surface p-4 rounded-[32px] flex-row items-center border border-surface-light/10 ${noMargin ? '' : 'mb-5'} shadow-sm shadow-black/20`}
    >
      <View className="w-16 h-16 bg-midnight rounded-[24px] items-center justify-center mr-4 overflow-hidden border border-surface-light/20">
        {jugador.foto ? (
          <Image source={{ uri: jugador.foto }} className="w-16 h-16" style={{ marginTop: 12 }} resizeMode="contain" />
        ) : (
          <Text className="text-accent-cyan text-lg font-black">{jugador.nickname[0]}</Text>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-white font-black text-lg tracking-tighter mr-2" numberOfLines={1}>{jugador.nickname}</Text>
          <View className="bg-midnight/50 px-3 py-1 rounded-lg border border-accent-cyan/20 items-center justify-center">
            <Text className="text-accent-cyan font-black text-[11px] uppercase tracking-widest">
              {jugador.rol === 'SUPPORT' ? 'SUPP' : jugador.rol}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mr-3 italic">{jugador.equipoLec}</Text>
          {jugador.tendencia === 'SUBE' ? (
            <View className="flex-row items-center">
              <ChevronUp size={12} color="#39FF14" />
              <Text className="text-neon-green text-[8px] font-black ml-0.5">TOP</Text>
            </View>
          ) : jugador.tendencia === 'BAJA' ? (
            <View className="flex-row items-center">
              <ChevronDown size={12} color="#FF003F" />
              <Text className="text-crimson text-[8px] font-black ml-0.5">DOWN</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="items-end">
        <Text className="text-white font-black text-xs mb-2 italic tracking-tighter">{precio.toLocaleString()} €</Text>
        <TouchableOpacity
          onPress={() => onClausulazo(jugador.id, jugador.nickname, jugador.precioBase, jugador.precioActual)}
          className="border border-crimson/40 px-4 py-2.5 rounded-2xl items-center justify-center bg-crimson/5"
        >
          <Text className="text-crimson font-black text-[11px] uppercase tracking-tighter">Robar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    transform: [{ translateX: -24 }, { translateY: -30 }], // Center the marker
  }
})
