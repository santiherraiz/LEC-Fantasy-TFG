import React from 'react';
import { View, Text, Image } from 'react-native';
import { Clock } from 'lucide-react-native';
import { PartidoCalendario } from '../types';

interface NextMatchHeroProps {
  partido: PartidoCalendario & { semana: number };
  countdown: string;
  fechaFormateada: string;
}

export const NextMatchHero = React.memo(({ partido, countdown, fechaFormateada }: NextMatchHeroProps) => {
  return (
    <View className="px-4 mb-8">
      <View
        className="bg-surface rounded-[32px] p-6 border border-accent-cyan/20 overflow-hidden shadow-2xl shadow-accent-cyan/10"
      >
        <View className="flex-row justify-between items-center mb-6">
          <View className="bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30">
            <Text className="text-accent-cyan font-black text-[10px] uppercase">Próximo Match • W{partido.semana}</Text>
          </View>
          <View className="flex-row items-center">
            <Clock color="#4B5563" size={14} />
            <Text className="text-gray-400 font-bold text-xs ml-1">{countdown}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-around py-2">
          <View className="items-center flex-1">
            <Image source={{ uri: partido.team1Logo }} className="w-16 h-16" resizeMode="contain" />
            <Text className="text-white font-black mt-2 text-lg">{partido.team1Abrev}</Text>
          </View>

          <View className="items-center px-4">
            <View className="w-10 h-10 bg-midnight rounded-full items-center justify-center border border-white/5">
              <Text className="text-gray-600 font-black italic">VS</Text>
            </View>
          </View>

          <View className="items-center flex-1">
            <Image source={{ uri: partido.team2Logo }} className="w-16 h-16" resizeMode="contain" />
            <Text className="text-white font-black mt-2 text-lg">{partido.team2Abrev}</Text>
          </View>
        </View>

        <View className="mt-6 pt-4 border-t border-white/5 items-center">
          <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-[3px]">
            {fechaFormateada}
          </Text>
        </View>
      </View>
    </View>
  );
});
