import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight, Medal } from 'lucide-react-native';
import { JugadorPuntuacionTotal } from '../types';

interface RankingPlayerItemProps {
  item: JugadorPuntuacionTotal;
  index: number;
}

export const RankingPlayerItem = React.memo(({ item, index }: RankingPlayerItemProps) => {
  return (
    <Link href={`/jugador/${item.jugador.id}`} asChild>
      <TouchableOpacity 
        className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center border border-surface-light/50"
      >
        <View className="w-10 items-center justify-center mr-3">
          {index < 3 ? (
            <Medal color={index === 0 ? '#FFD700' : index === 1 ? '#9CA3AF' : '#CD7F32'} size={24} />
          ) : (
            <Text className="text-gray-500 font-bold text-lg">{index + 1}</Text>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{item.jugador.nickname}</Text>
          <View className="flex-row items-center mt-1">
            {item.jugador.equipoLec?.logoUrl && (
              <Image 
                source={{ uri: item.jugador.equipoLec.logoUrl }} 
                className="w-4 h-4 mr-2"
                resizeMode="contain"
              />
            )}
            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
              {item.jugador.equipoLec?.nombre} • {item.jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : item.jugador.rol}
            </Text>
          </View>
        </View>

        <View className="items-end mr-3">
          <Text className="text-accent-cyan text-xl font-bold">{Math.round(item.puntosTotales)}</Text>
          <Text className="text-gray-500 text-[10px] font-bold tracking-tighter">PTS</Text>
        </View>

        <ChevronRight color="#4B5563" size={20} />
      </TouchableOpacity>
    </Link>
  );
});
