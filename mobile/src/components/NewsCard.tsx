import React from 'react';
import { View, Text, Image } from 'react-native';
import { Flame, ShoppingCart, Info, TrendingDown, Trophy } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { NoticiaLiga, TipoNoticia } from '../types';

interface NewsCardProps {
  item: NoticiaLiga;
}

const getEventStyle = (tipo: TipoNoticia) => {
  switch (tipo) {
    case 'CLAUSULAZO':
      return { 
        label: 'CLAUSULAZO',
        color: '#FF4B4B', 
        icon: <Flame color="#FF4B4B" size={18} strokeWidth={2.5} />, 
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      };
    case 'FICHAJE':
    case 'SUBASTA_GANADA':
      return { 
        label: 'MERCADO',
        color: '#00D1FF', 
        icon: <ShoppingCart color="#00D1FF" size={18} strokeWidth={2.5} />, 
        bg: 'bg-accent-cyan/10',
        border: 'border-accent-cyan/30'
      };
    case 'VENTA':
      return { 
        label: 'OPERACIÓN',
        color: '#94A3B8', 
        icon: <TrendingDown color="#94A3B8" size={18} strokeWidth={2.5} />, 
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30'
      };
    case 'RESULTADO_JORNADA':
      return { 
        label: 'RESULTADOS',
        color: '#FFD700', 
        icon: <Trophy color="#FFD700" size={18} strokeWidth={2.5} />, 
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
      };
    default:
      return { 
        label: 'SISTEMA',
        color: '#3B82F6', 
        icon: <Info color="#3B82F6" size={18} strokeWidth={2.5} />, 
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30'
      };
  }
};

export const NewsCard = React.memo(({ item }: NewsCardProps) => {
  const style = getEventStyle(item.tipoNoticia);
  const date = new Date(item.fecha);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: es }).replace('alrededor de ', '');

  const formattedMessage = item.mensaje.replace(/Jornada (\d+)/g, (match, p1) => {
    const w = parseInt(p1);
    return `Jornada ${w > 90 ? w - 90 : w}`;
  });

  return (
    <View className={`mb-3 mx-4 rounded-2xl bg-surface border ${style.border} overflow-hidden shadow-sm`}>
      <View className="p-4 flex-row items-center">
        {/* Icon Container */}
        <View className={`w-12 h-12 rounded-xl ${style.bg} items-center justify-center mr-4`}>
          {style.icon}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text 
              className="font-black text-[10px] tracking-widest"
              style={{ color: style.color }}
            >
              {style.label}
            </Text>
            <Text className="text-gray-500 text-[10px] font-medium">
              {timeAgo}
            </Text>
          </View>
          <Text className="text-gray-100 text-[13px] font-semibold leading-5 pr-2">
            {formattedMessage}
          </Text>
        </View>

        {/* Optional Image */}
        {item.imagenUrl && (
          <View className="ml-2 shadow-lg">
            <Image 
              source={{ uri: item.imagenUrl }} 
              className="w-14 h-14 rounded-xl bg-midnight/80"
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </View>
  );
});
