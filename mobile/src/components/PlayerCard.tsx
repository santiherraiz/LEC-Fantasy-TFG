import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { User, CircleDollarSign, ArrowRightLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface PlayerCardProps {
  id: number;
  nickname: string;
  equipoLec: string;
  rol: string;
  imagenUrl?: string;
  puntos?: number;
  precio?: number;
  estado?: 'TITULAR' | 'BANQUILLO' | 'MERCADO';
  onPressAction?: () => void;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  showSellButton?: boolean;
  onSellPress?: () => void;
  isOwnTeam?: boolean;
  hideBadge?: boolean;
  hideRole?: boolean;
  noMargin?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  id,
  nickname,
  equipoLec,
  rol,
  imagenUrl,
  puntos,
  precio,
  estado,
  onPressAction,
  actionIcon,
  actionLabel,
  showSellButton,
  onSellPress,
  isOwnTeam,
  hideBadge,
  hideRole,
  noMargin
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/jugador/${id}`)}
      activeOpacity={0.9}
      className={`bg-surface p-4 rounded-[32px] flex-row items-center border border-surface-light/10 shadow-sm shadow-black/20 ${noMargin ? '' : 'mb-4'}`}
    >
      {/* Player Image/Avatar */}
      <View className="w-16 h-16 bg-midnight rounded-[24px] items-center justify-center mr-4 overflow-hidden border border-surface-light/20">
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} className="w-16 h-16" style={{ marginTop: 12 }} resizeMode="contain" />
        ) : (
          <Text className="text-accent-cyan text-lg font-black">{nickname[0]}</Text>
        )}
      </View>

      {/* Player Info */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-white font-black text-lg tracking-tighter mr-2" numberOfLines={1} style={{ flexShrink: 1 }}>{nickname}</Text>
          {!hideRole && (
            <View className="bg-midnight/50 px-2 py-0.5 rounded-lg border border-surface-light/20 shrink-0">
              <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter">{rol}</Text>
            </View>
          )}
          {!hideBadge && estado === 'TITULAR' && (
            <View className="bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/30 ml-2 shrink-0">
              <Text className="text-accent-cyan text-[8px] font-black uppercase italic">Titular</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mr-3 italic">{equipoLec}</Text>
        </View>
      </View>

      {/* Stats and Actions */}
      <View className="items-end">
        {puntos !== undefined && (
          <Text className="text-accent-cyan font-black text-xl italic mb-1">{Math.round(puntos)} <Text className="text-[10px]">PTS</Text></Text>
        )}
        {(precio !== undefined && precio !== null) && (
          <Text className="text-white font-black text-xs mb-2 italic tracking-tighter">{precio.toLocaleString()} €</Text>
        )}

        <View className="flex-row items-center">
          {showSellButton && onSellPress && (
            <TouchableOpacity
              onPress={onSellPress}
              className="w-12 h-12 bg-crimson/10 rounded-2xl items-center justify-center border border-crimson/20 mr-2"
            >
              <CircleDollarSign size={20} color="#FB7185" />
            </TouchableOpacity>
          )}
          
          {onPressAction && (
            <TouchableOpacity
              onPress={onPressAction}
              className={`h-10 px-4 rounded-xl items-center justify-center flex-row ${estado === 'TITULAR' ? 'bg-accent-cyan shadow-md shadow-accent-cyan/40' : 'bg-surface-light/50 border border-surface-light'}`}
            >
              {actionIcon || <ArrowRightLeft size={16} color={estado === 'TITULAR' ? '#0B0E14' : 'white'} />}
              {actionLabel && (
                <Text className={`ml-2 font-black text-[9px] tracking-widest ${estado === 'TITULAR' ? 'text-midnight' : 'text-white'}`}>
                  {actionLabel}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
