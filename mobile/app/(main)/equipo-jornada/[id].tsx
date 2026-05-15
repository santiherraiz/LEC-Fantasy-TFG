import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Map as MapIcon, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import CustomHeader from '../../../src/components/CustomHeader';
import { useEquipoJornada } from '../../../src/hooks/useEquipoJornada';
import { TacticalMap } from '../../../src/components/TacticalMap';
import { JornadaSelector } from '../../../src/components/JornadaSelector';
import { PlayerPointsCard } from '../../../src/components/PlayerPointsCard';

const { width } = Dimensions.get('window');
const MAP_SIZE = width;

export default function EquipoJornadaScreen() {
  const router = useRouter();
  const {
    equipo,
    jornadas,
    selectedJornada,
    loading,
    refreshing,
    currentIndex,
    onRefresh,
    handleNextJornada,
    handlePrevJornada
  } = useEquipoJornada();

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader title="Histórico de Puntos" showBackButton />

      <JornadaSelector
        selectedJornada={selectedJornada}
        currentIndex={currentIndex}
        totalJornadas={jornadas.length}
        onPrev={handlePrevJornada}
        onNext={handleNextJornada}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
      >
        {equipo && equipo.jugadores.length > 0 ? (
          <>
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

              <View className="relative items-center mt-4">
                <View className="absolute -top-4 left-0 right-0 flex-row items-center justify-center z-10">
                  <View className="bg-midnight/80 px-4 py-1.5 rounded-full border border-accent-cyan/30 flex-row items-center">
                    <MapIcon color="#00D1FF" size={12} />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-2 italic">Alineación Confirmada</Text>
                  </View>
                </View>
                <TacticalMap jugadores={equipo.jugadores} mapSize={MAP_SIZE} />
              </View>
            </Animated.View>

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

              {[...equipo.jugadores]
                .sort((a, b) => b.puntosSemanales - a.puntosSemanales)
                .map((j, idx) => (
                  <PlayerPointsCard
                    key={j.idJugador}
                    jugador={j}
                    isMVP={idx === 0}
                  />
                ))}
            </View>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} className="flex-1 items-center justify-center py-20 px-10">
            <View className="w-24 h-24 bg-surface rounded-[32px] items-center justify-center mb-6 border border-surface-light/20 shadow-2xl">
              <ShieldCheck color="#475569" size={48} />
            </View>
            <Text className="text-white font-black text-xl italic uppercase text-center mb-2 tracking-tighter">Sin equipo registrado</Text>
            <Text className="text-gray-500 text-center text-sm leading-relaxed mb-8">
              {selectedJornada?.estado === 'PROGRAMADA'
                ? "Esta jornada aún no ha comenzado. Tu alineación se guardará automáticamente 15 minutos antes del inicio."
                : "No tenías jugadores titulares registrados en esta jornada."}
            </Text>

            {selectedJornada?.estado === 'PROGRAMADA' && (
              <TouchableOpacity
                onPress={() => router.push('/(main)/equipo')}
                className="bg-accent-cyan py-4 px-8 rounded-full shadow-lg shadow-accent-cyan/40"
              >
                <Text className="text-midnight font-black uppercase tracking-widest text-xs">Gestionar mi equipo</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
