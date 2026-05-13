import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, Medal } from 'lucide-react-native';
import { RankingEntry } from '../types';

interface RankingItemProps {
  entry: RankingEntry;
  index: number;
  isOwnTeam: boolean;
  onPress: () => void;
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy color="#FFD700" size={24} />;
  if (index === 1) return <Medal color="#94a3b8" size={24} />;
  if (index === 2) return <Medal color="#CD7F32" size={24} />;
  return <Text className="text-gray-500 font-bold text-lg">{index + 1}</Text>;
};

export const RankingItem = React.memo(({ entry, index, isOwnTeam, onPress }: RankingItemProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={`bg-surface p-5 rounded-[32px] flex-row items-center mb-3 border border-surface-light/20 ${index === 0 ? 'border-accent-cyan/30' : ''} ${isOwnTeam ? 'bg-accent-cyan/5 border-accent-cyan/30' : ''}`}
    >
      <View className="w-10 items-center mr-4">{getRankIcon(index)}</View>
      <View className="flex-1">
        <Text className="text-white font-bold text-lg">{entry.nombreUsuario || 'Usuario'}</Text>
        <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
          {isOwnTeam ? 'Tu Equipo' : 'Manager de la Liga'}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-accent-cyan font-black text-2xl italic tracking-tighter">{Math.round(entry.puntosTotales ?? 0)}</Text>
        <Text className="text-gray-500 text-[8px] font-black uppercase">Puntos</Text>
      </View>
    </TouchableOpacity>
  );
});
