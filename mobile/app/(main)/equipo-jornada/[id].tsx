import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, ImageBackground, Dimensions, StyleSheet, DimensionValue } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  ShieldCheck
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import api from '../../../src/api/api';
import { EquipoJornadaDTO, Jornada, JugadorPuntosDTO } from '../../../src/types';
import CustomHeader from '../../../src/components/CustomHeader';
import MapaImage from '../../../assets/images/mapa.png';

const { width } = Dimensions.get('window');
const MAP_SIZE = width;

const ROLE_COORDINATES: Record<string, { top: DimensionValue, left: DimensionValue }> = {
  'TOP': { top: '23%', left: '13%' },
  'JUNGLE': { top: '49%', left: '27%' },
  'MID': { top: '57%', left: '45%' },
  'BOT': { top: '83%', left: '67%' },
  'SUPPORT': { top: '84%', left: '85%' },
};

export default function EquipoJornadaScreen() {
  const { id, jornadaId: paramJornadaId } = useLocalSearchParams();
  const router = useRouter();
  const [equipo, setEquipo] = useState<EquipoJornadaDTO | null>(null);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [id, paramJornadaId])
  );

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Obtener todas las jornadas para el selector (solo las que ya tienen snapshot)
      const jornadasRes = await api.get('/jornadas');
      const allJornadas = jornadasRes.data
        .filter((j: Jornada) => j.estado !== 'PROGRAMADA')
        .sort((a: Jornada, b: Jornada) => b.numeroSemana - a.numeroSemana);
      setJornadas(allJornadas);

      // 2. Determinar qué jornada mostrar
      let currentJ: Jornada | null = null;
      if (paramJornadaId) {
        currentJ = allJornadas.find((j: Jornada) => j.id.toString() === paramJornadaId) || null;
      } else if (allJornadas.length > 0) {
        // Por defecto la más reciente que tenga snapshot
        currentJ = allJornadas[0];
      } else {
        // Si no hay ninguna jornada con snapshot todavía
        const actualRes = await api.get('/jornadas/actual');
        currentJ = actualRes.data;
      }

      setSelectedJornada(currentJ);
      if (currentJ) {
        await fetchEquipoJornada(id as string, currentJ.id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEquipoJornada = async (equipoId: string, jId: number) => {
    try {
      const response = await api.get(`/equipos/${equipoId}/jornada/${jId}`);
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching team week:', error);
      setEquipo(null);
    }
  };

  const changeJornada = async (newJ: Jornada | undefined) => {
    if (!newJ || !newJ.id) return;
    setRefreshing(true);
    setSelectedJornada(newJ);
    await fetchEquipoJornada(id as string, newJ.id);
    setRefreshing(false);
  };

  const MinimapMarker = ({ jugador }: { jugador: JugadorPuntosDTO }) => {
    const role = jugador.rol.toUpperCase();
    const coords = ROLE_COORDINATES[role] || { top: '0%', left: '0%' };

    return (
      <View style={StyleSheet.flatten([styles.marker, { top: coords.top, left: coords.left }])}>
        <View className="items-center">
          <View className="w-14 h-14 rounded-full bg-midnight border-2 border-accent-cyan items-center justify-center shadow-lg shadow-accent-cyan/50 overflow-hidden">
            {jugador.imagenUrl ? (
              <Image source={{ uri: jugador.imagenUrl }} className="w-14 h-14" style={{ marginTop: 8 }} resizeMode="contain" />
            ) : (
              <User color="#00D1FF" size={24} />
            )}
          </View>
          <View className="bg-midnight/90 px-2 py-1 rounded-md mt-1 border border-accent-cyan/40">
            <Text className="text-white text-[10px] font-black uppercase tracking-tighter">{jugador.nickname}</Text>
            <Text className="text-accent-cyan text-[8px] font-bold text-center">+{Math.round(jugador.puntosSemanales)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  const currentIndex = jornadas.findIndex(j => j.id === selectedJornada?.id);

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader title="Histórico de Puntos" showBackButton />

      {/* Selector de Jornada */}
      <View className="bg-surface/50 border-b border-surface-light/20 py-4 px-6 flex-row items-center justify-between">
        <TouchableOpacity
          disabled={currentIndex === -1 || currentIndex === jornadas.length - 1}
          onPress={() => {
            if (currentIndex < jornadas.length - 1) changeJornada(jornadas[currentIndex + 1]);
          }}
          className={`p-2 bg-midnight rounded-full border ${(currentIndex === -1 || currentIndex === jornadas.length - 1) ? 'border-surface-light/5 opacity-30' : 'border-surface-light/20'}`}
        >
          <ChevronLeft color={(currentIndex === -1 || currentIndex === jornadas.length - 1) ? "#475569" : "#00D1FF"} size={20} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Semana</Text>
          <Text className="text-white font-black text-xl italic uppercase">
            {selectedJornada ? selectedJornada.numeroSemana : '...'}
          </Text>
          {selectedJornada && (
            <View className={`px-2 py-0.5 rounded-full mt-1 ${selectedJornada.estado === 'FINALIZADA' ? 'bg-neon-green/10 border border-neon-green/30' :
              selectedJornada.estado === 'BLOQUEADA' ? 'bg-accent-cyan/10 border border-accent-cyan/30' : 'bg-gray-500/10 border border-gray-500/30'
              }`}>
              <Text className={`text-[8px] font-black uppercase tracking-widest ${selectedJornada.estado === 'FINALIZADA' ? 'text-neon-green' :
                selectedJornada.estado === 'BLOQUEADA' ? 'text-accent-cyan' : 'text-gray-500'
                }`}>{selectedJornada.estado}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          disabled={currentIndex <= 0}
          onPress={() => {
            if (currentIndex > 0) changeJornada(jornadas[currentIndex - 1]);
          }}
          className={`p-2 bg-midnight rounded-full border ${(currentIndex <= 0) ? 'border-surface-light/5 opacity-30' : 'border-surface-light/20'}`}
        >
          <ChevronRight color={(currentIndex <= 0) ? "#475569" : "#00D1FF"} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInitialData(); }} tintColor="#00D1FF" />}
      >
        {equipo ? (
          <>
            {/* Team Header */}
            <Animated.View entering={FadeInDown.duration(600)} className="px-6 py-8">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-1 mr-4">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-1">Equipo de {equipo.nombreUsuario}</Text>
                  <Text className="text-white font-black text-1xl italic uppercase tracking-tighter" numberOfLines={1}>
                    {equipo.nombreEquipo}
                  </Text>
                </View>
                <View className="bg-surface p-4 rounded-3xl border border-accent-cyan/20 items-center min-w-[100px]">
                  <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Puntos Semana</Text>
                  <View className="flex-row items-end">
                    <Text className="text-accent-cyan text-3xl font-black italic">{Math.round(equipo.puntosTotalesJornada)}</Text>
                    <Text className="text-accent-cyan/60 font-black text-[10px] mb-1 ml-1">PTS</Text>
                  </View>
                </View>
              </View>

              {/* Tactic Map */}
              <View className="relative items-center mt-4">
                <View className="absolute -top-4 left-0 right-0 flex-row items-center justify-center z-10">
                  <View className="bg-midnight/80 px-4 py-1.5 rounded-full border border-accent-cyan/30 flex-row items-center">
                    <MapIcon color="#00D1FF" size={12} />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-2 italic">Alineación Confirmada</Text>
                  </View>
                </View>

                <ImageBackground
                  source={MapaImage}
                  style={{ width: MAP_SIZE * 0.9, height: MAP_SIZE * 0.9 }}
                  imageStyle={{ borderRadius: 48 }}
                  className="border-2 border-surface-light/20 rounded-[48px] overflow-hidden shadow-2xl bg-surface"
                >
                  {equipo.jugadores.map(j => <MinimapMarker key={j.idJugador} jugador={j} />)}
                </ImageBackground>
              </View>
            </Animated.View>

            {/* Starters List */}
            <View className="bg-surface/50 rounded-t-[48px] px-6 pt-10 pb-32 border-t border-surface-light/20">
              <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center">
                  <ShieldCheck color="#00D1FF" size={24} />
                  <Text className="text-white text-2xl font-black ml-4 tracking-tight">TITULARES</Text>
                </View>
                <View className="bg-midnight/50 px-4 py-1.5 rounded-full border border-surface-light/20">
                  <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Snapshot Semanal</Text>
                </View>
              </View>

              {equipo.jugadores.sort((a, b) => b.puntosSemanales - a.puntosSemanales).map((j, idx) => (
                <TouchableOpacity
                  key={j.idJugador}
                  onPress={() => router.push(`/(main)/jugador/${j.idJugador}`)}
                  activeOpacity={0.9}
                  className="bg-surface p-4 rounded-[32px] flex-row items-center mb-4 border border-surface-light/10"
                >
                  <View className="w-14 h-14 bg-midnight rounded-[22px] items-center justify-center mr-4 overflow-hidden border border-surface-light/20">
                    {j.imagenUrl ? (
                      <Image source={{ uri: j.imagenUrl }} className="w-14 h-14" style={{ marginTop: 10 }} resizeMode="contain" />
                    ) : (
                      <Text className="text-accent-cyan text-lg font-black">{j.nickname[0]}</Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-white font-black text-lg tracking-tighter mr-2">{j.nickname}</Text>
                      {idx === 0 && j.puntosSemanales > 0 && (
                        <View className="bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/30">
                          <Text className="text-accent-cyan text-[8px] font-black uppercase italic">MVP Semana</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mr-3 italic">{j.equipoLec}</Text>
                      <View className="bg-midnight/50 px-2 py-0.5 rounded-lg border border-surface-light/20">
                        <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">{j.rol}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className={`font-black text-2xl italic ${j.puntosSemanales > 0 ? 'text-accent-cyan' : 'text-gray-700'}`}>
                      {Math.round(j.puntosSemanales)}
                    </Text>
                    <Text className="text-gray-600 text-[8px] font-black uppercase">Puntos</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20 px-10">
            <View className="w-20 h-20 bg-surface rounded-full items-center justify-center mb-6 border border-surface-light/20">
              <TrendingUp color="#334155" size={40} />
            </View>
            <Text className="text-white font-black text-xl italic uppercase text-center mb-2">Sin datos de alineación</Text>
            <Text className="text-gray-500 text-center text-sm">
              Parece que aún no se ha realizado el snapshot para esta jornada o el equipo no tenía jugadores alineados.
            </Text>

            {selectedJornada?.estado === 'PROGRAMADA' && (
              <View className="mt-8 bg-accent-cyan/10 p-5 rounded-3xl border border-accent-cyan/20">
                <Text className="text-accent-cyan font-bold text-center text-xs uppercase tracking-widest leading-relaxed">
                  Esta jornada aún no ha comenzado. El equipo se bloqueará 15 minutos antes del primer partido.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    transform: [{ translateX: -28 }, { translateY: -35 }], // Center the marker
  }
});
