import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { User as UserIcon, ChevronUp, ChevronDown } from 'lucide-react-native';
import { CatalogoJugador } from '../types';

interface CatalogoCardProps {
  item: CatalogoJugador;
  isOwnPlayer: boolean;
}

export const CatalogoCard = React.memo(({ item, isOwnPlayer }: CatalogoCardProps) => {
  return (
    <Link href={`/jugador/${item.jugador.id}`} asChild>
      <TouchableOpacity className="bg-surface rounded-2xl mb-4 border border-surface-light/20 overflow-hidden shadow-sm">
        <View className="p-4 flex-row items-center">

          {/* Avatar y Posición */}
          <View className="relative">
            <View className="w-24 h-24 bg-midnight/50 rounded-3xl items-center justify-center border border-surface-light/20 overflow-hidden shadow-inner">
              {item.jugador.imagenUrl ? (
                <Image
                  source={{ uri: item.jugador.imagenUrl }}
                  className="w-24 h-24"
                  style={{ marginTop: 12 }}
                  resizeMode="contain"
                />
              ) : (
                <UserIcon size={32} color="#00D1FF" />
              )}
            </View>

            {/* ESCUDO FLOTANTE */}
            {item.jugador.equipoLec?.logoUrl && (
              <View className="absolute top-1 left-1">
                <Image
                  source={{ uri: item.jugador.equipoLec.logoUrl }}
                  className="w-7 h-7"
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          {/* Info principal */}
          <View className="ml-6 flex-1 justify-center">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-white font-black text-xl tracking-tight mr-3">{item.jugador.nickname}</Text>
              
              {/* CHIP DE POSICIÓN */}
              <View className="bg-accent-cyan/10 border border-accent-cyan/40 px-2 py-0.5 rounded-md">
                <Text className="text-accent-cyan font-black text-[9px] uppercase italic">
                  {item.jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : item.jugador.rol}
                </Text>
              </View>
            </View>

            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">
              {item.jugador.equipoLec?.nombre || 'Sin equipo'}
            </Text>

            <View className="flex-row items-center">
              {item.propietarioNickname ? (
                isOwnPlayer ? (
                  <View className="flex-row items-center bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                    <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5" />
                    <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-wide">MÍO</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                    <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                    <Text className="text-rose-400 text-[10px] font-black uppercase tracking-wide">{item.propietarioNickname}</Text>
                  </View>
                )
              ) : (
                <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                  <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-wide">LIBRE</Text>
                </View>
              )}
            </View>
          </View>

          {/* Puntos */}
          <View className="items-end justify-center">
            <View className="bg-accent-cyan/5 px-3 py-2 rounded-2xl border border-accent-cyan/10 items-center">
              <Text className="text-accent-cyan font-black text-2xl tracking-tighter">
                {Math.round(item.puntosTotales)}
              </Text>
              <Text className="text-accent-cyan/60 text-[8px] font-black uppercase tracking-[2px] -mt-1">
                PTS
              </Text>
            </View>
          </View>
        </View>

        {/* Footer: Valor de mercado */}
        <View className="bg-midnight/60 px-4 py-3 flex-row items-center justify-between border-t border-surface-light/10">
          <View>
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Valor de mercado</Text>
            <View className="flex-row items-center mt-0.5">
              {item.jugador.tendencia === 'SUBE' && <ChevronUp size={14} color="#10B981" />}
              {item.jugador.tendencia === 'BAJA' && <ChevronDown size={14} color="#F43F5E" />}
              <Text className={`text-[10px] font-black ml-1 ${
                item.jugador.tendencia === 'SUBE' ? 'text-emerald-400' : 
                item.jugador.tendencia === 'BAJA' ? 'text-rose-400' : 'text-gray-500'
              }`}>
                {item.jugador.tendencia === 'SUBE' ? 'SUBIENDO' : 
                 item.jugador.tendencia === 'BAJA' ? 'BAJANDO' : 
                 item.jugador.tendencia || 'ESTABLE'}
              </Text>
            </View>
          </View>
          <Text className="text-emerald-400 font-black text-base">
            {(item.jugador.precioActual || item.jugador.precioBase).toLocaleString()} €
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
});
