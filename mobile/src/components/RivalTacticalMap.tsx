import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, DimensionValue } from 'react-native';
import { User } from 'lucide-react-native';
import { JugadorRival } from '../types';
import MapaImage from '../../assets/images/mapa.png';

const ROLE_COORDINATES: Record<string, { top: DimensionValue, left: DimensionValue }> = {
  'TOP': { top: '23%', left: '13%' },
  'JUNGLE': { top: '49%', left: '27%' },
  'MID': { top: '57%', left: '45%' },
  'BOT': { top: '83%', left: '67%' },
  'SUPPORT': { top: '84%', left: '85%' },
};

interface RivalTacticalMapProps {
  jugadores: JugadorRival[];
  mapSize: number;
}

const MinimapMarker = ({ jugador }: { jugador: JugadorRival }) => {
  const role = jugador.rol.toUpperCase();
  const coords = ROLE_COORDINATES[role] || { top: '0%', left: '0%' };

  return (
    <View style={[styles.marker, { top: coords.top, left: coords.left }]}>
      <View className="items-center">
        <View className="w-14 h-14 rounded-full bg-midnight border-2 border-accent-cyan items-center justify-center shadow-lg shadow-accent-cyan/50 overflow-hidden">
          {jugador.foto ? (
            <Image source={{ uri: jugador.foto }} className="w-14 h-14" style={{ marginTop: 8 }} resizeMode="contain" />
          ) : (
            <User color="#00D1FF" size={24} />
          )}
        </View>
        <View className="bg-midnight/90 px-2 py-1 rounded-md mt-1 border border-accent-cyan/40">
          <Text className="text-white text-[10px] font-black uppercase tracking-tighter" numberOfLines={1}>{jugador.nickname}</Text>
        </View>
      </View>
    </View>
  );
};

export const RivalTacticalMap = React.memo(({ jugadores, mapSize }: RivalTacticalMapProps) => {
  return (
    <ImageBackground
      source={MapaImage}
      style={{ width: mapSize * 0.9, height: mapSize * 0.9 }}
      imageStyle={{
        borderRadius: 48,
        transform: [{ scale: 1.05 }]
      }}
      resizeMode="cover"
      className="border-2 border-surface-light/20 rounded-[48px] overflow-hidden shadow-2xl bg-surface"
    >
      {jugadores.map(j => (
        <MinimapMarker key={j.id} jugador={j} />
      ))}
      {jugadores.length === 0 && (
        <View className="absolute inset-0 items-center justify-center p-10 bg-midnight/40">
          <Text className="text-gray-500 font-black text-center text-sm uppercase italic tracking-widest">Sin alineación confirmada</Text>
        </View>
      )}
    </ImageBackground>
  );
});

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    transform: [{ translateX: -28 }, { translateY: -35 }],
  }
});
