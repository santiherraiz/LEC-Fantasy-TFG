import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap } from 'lucide-react-native';

import { useCalendario } from '../../src/hooks/useCalendario';
import { NextMatchHero } from '../../src/components/NextMatchHero';
import { CalendarMatchItem } from '../../src/components/CalendarMatchItem';
import CustomHeader from '../../src/components/CustomHeader';

export default function CalendarioScreen() {
  const router = useRouter();
  const {
    calendario,
    serverTime,
    loading,
    refreshing,
    onRefresh,
    proximoPartido,
    formatCountdown,
    formatFechaExtensa
  } = useCalendario();

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader showBackButton={true} onBackPress={() => router.push('/(tabs)/feed')} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white text-4xl font-black tracking-tighter italic uppercase">Calendario</Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-accent-cyan mr-2 animate-pulse" />
            <Text className="text-gray-500 font-bold text-xs uppercase tracking-widest">Horario Oficial 2026</Text>
          </View>
        </View>

        {proximoPartido && (
          <NextMatchHero
            partido={proximoPartido}
            countdown={formatCountdown(proximoPartido.fecha)}
            fechaFormateada={formatFechaExtensa(proximoPartido.fecha)}
          />
        )}

        <View className="px-6">
          {calendario.map((jornada, jIdx) => (
            <View key={jornada.semana || jIdx} className="mb-10">
              <View className="flex-row items-center mb-6">
                <View className="flex-row items-center">
                  <Text className="text-white font-black text-2xl italic uppercase">
                    Semana{' '}
                  </Text>
                  <Text className="text-accent-cyan font-black text-2xl italic uppercase">
                    {jornada.semana || (jIdx + 1)}
                  </Text>
                </View>
                <View className="flex-1 h-[1px] bg-accent-cyan/20 ml-4" />
              </View>

              {jornada.dias.map((dia) => {
                const isPastDia = new Date(dia.fecha) < new Date(serverTime.toDateString());
                const isToday = new Date(dia.fecha).toDateString() === serverTime.toDateString();

                return (
                  <View key={dia.fecha} className={`mb-8 ${isPastDia ? 'opacity-40' : ''}`}>
                    <View className="flex-row items-center mb-4">
                      <View className={`w-2 h-2 rounded-full mr-3 ${isToday ? 'bg-accent-cyan shadow-lg shadow-accent-cyan' : 'bg-gray-700'}`} />
                      <Text className={`font-black text-sm uppercase tracking-widest ${isToday ? 'text-accent-cyan' : 'text-gray-400'}`}>
                        {formatFechaExtensa(dia.fecha)}
                        {isToday && " • HOY"}
                      </Text>
                    </View>

                    {dia.partidos.map((partido) => (
                      <CalendarMatchItem
                        key={partido.gameId}
                        partido={partido}
                        isToday={isToday}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {calendario.length === 0 && (
          <View className="items-center justify-center mt-20 px-10">
            <Zap color="#1F2937" size={64} />
            <Text className="text-gray-500 mt-4 text-center font-bold uppercase tracking-widest">
              No hay partidos sincronizados para este modo
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
