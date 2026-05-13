import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { JugadorPuntosDTO } from '../types';

interface PlayerPointsCardProps {
  jugador: JugadorPuntosDTO;
  isMVP?: boolean;
}

export const PlayerPointsCard = React.memo(({ jugador, isMVP }: PlayerPointsCardProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/jugador/${jugador.idJugador}`)}
      activeOpacity={0.9}
      className="bg-surface p-4 rounded-[32px] flex-row items-center mb-4 border border-surface-light/10"
    >
      <View className="w-14 h-14 bg-midnight rounded-[22px] items-center justify-center mr-4 overflow-hidden border border-surface-light/20">
        {jugador.imagenUrl ? (
          <Image source={{ uri: jugador.imagenUrl }} className="w-14 h-14" style={{ marginTop: 10 }} resizeMode="contain" />
        ) : (
          <Text className="text-accent-cyan text-lg font-black">{jugador.nickname[0]}</Text>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-white font-black text-lg tracking-tighter mr-2">{jugador.nickname}</Text>
          {isMVP && jugador.puntosSemanales > 0 && (
            <View className="bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/30">
              <Text className="text-accent-cyan text-[8px] font-black uppercase italic">MVP Semana</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mr-3 italic">{jugador.equipoLec}</Text>
          <View className="bg-midnight/50 px-2 py-0.5 rounded-lg border border-surface-light/20">
            <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">{jugador.rol}</Text>
          </View>
        </View>
      </View>

      <View className="items-end">
        <Text className={`font-black text-2xl italic ${jugador.puntosSemanales > 0 ? 'text-accent-cyan' : 'text-gray-700'}`}>
          {Math.round(jugador.puntosSemanales)}
        </Text>
        <Text className="text-gray-600 text-[8px] font-black uppercase">Puntos</Text>
      </View>
    </TouchableOpacity>
  );
});
