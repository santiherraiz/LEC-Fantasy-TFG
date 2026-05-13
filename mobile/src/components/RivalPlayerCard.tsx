import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { JugadorRival } from '../types';

interface RivalPlayerCardProps {
  jugador: JugadorRival;
  onClausulazo: (id: number, nick: string, precioBase: number, precioActual: number) => void;
  noMargin?: boolean;
  isOwnTeam?: boolean;
}

export const RivalPlayerCard = React.memo(({ jugador, onClausulazo, noMargin, isOwnTeam }: RivalPlayerCardProps) => {
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
        {!isOwnTeam && (
          <TouchableOpacity
            onPress={() => onClausulazo(jugador.id, jugador.nickname, jugador.precioBase, jugador.precioActual)}
            className="border border-crimson/40 px-4 py-2.5 rounded-2xl items-center justify-center bg-crimson/5"
          >
            <Text className="text-crimson font-black text-[11px] uppercase tracking-tighter">Robar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});
