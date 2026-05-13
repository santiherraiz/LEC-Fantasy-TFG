import React from 'react';
import { View, Text, Image } from 'react-native';
import { PartidoCalendario } from '../types';

interface CalendarMatchItemProps {
  partido: PartidoCalendario;
  isToday: boolean;
}

export const CalendarMatchItem = React.memo(({ partido, isToday }: CalendarMatchItemProps) => {
  const isPlayed = !!partido.winTeam;

  return (
    <View
      className={`bg-surface/50 rounded-2xl p-5 mb-3 border ${isToday ? 'border-accent-cyan/30' : 'border-surface-light/30'} ${isPlayed ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-center justify-between">
        {/* Team 1 */}
        <View className="flex-row items-center flex-1">
          <Image source={{ uri: partido.team1Logo }} className="w-8 h-8 mr-3" resizeMode="contain" />
          <Text className={`font-black text-base ${partido.winTeam === partido.team1 ? 'text-accent-cyan' : 'text-white'}`}>
            {partido.team1Abrev}
          </Text>
        </View>

        {/* Status Center */}
        <View className="items-center px-2 min-w-[100px]">
          {isPlayed ? (
            <View className="flex-row items-center">
              <Text className="text-white font-black text-lg mx-1">{partido.team1Score}</Text>
              <View className="bg-midnight px-2 py-1 rounded-md border border-white/5 mx-1">
                <Text className="text-gray-500 font-black text-[10px]">FINAL</Text>
              </View>
              <Text className="text-white font-black text-lg mx-1">{partido.team2Score}</Text>
            </View>
          ) : (
            <Text className="text-accent-cyan font-black text-sm">
              {new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
          )}
        </View>

        {/* Team 2 */}
        <View className="flex-row items-center flex-1 justify-end">
          <Text className={`font-black text-base mr-3 ${partido.winTeam === partido.team2 ? 'text-accent-cyan' : 'text-white'}`}>
            {partido.team2Abrev}
          </Text>
          <Image source={{ uri: partido.team2Logo }} className="w-8 h-8" resizeMode="contain" />
        </View>
      </View>
    </View>
  );
});
