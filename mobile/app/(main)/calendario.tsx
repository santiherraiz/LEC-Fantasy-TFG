import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { JornadaCalendario, PartidoCalendario } from '../../src/types';
import CustomHeader from '../../src/components/CustomHeader';
import { Calendar, Clock, ChevronRight, History, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CalendarioScreen() {
  const router = useRouter();
  const [calendario, setCalendario] = useState<JornadaCalendario[]>([]);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [calRes, timeRes] = await Promise.all([
        api.get('/partidos/calendario'),
        api.get('/public/time')
      ]);
      setCalendario(calRes.data);
      setServerTime(new Date(timeRes.data.serverTime));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Encontrar el próximo partido
  const proximoPartido = useMemo(() => {
    let matches: (PartidoCalendario & { semana: number })[] = [];
    calendario.forEach(j => {
      j.dias.forEach(d => {
        d.partidos.forEach(p => {
          matches.push({ ...p, semana: j.semana });
        });
      });
    });

    return matches
      .filter(m => new Date(m.fecha) > serverTime)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
  }, [calendario, serverTime]);

  const formatCountdown = (target: string) => {
    const diff = new Date(target).getTime() - serverTime.getTime();
    if (diff <= 0) return "¡EMPEZANDO!";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatFechaExtensa = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} DE ${meses[fecha.getMonth()]}`;
  };

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
        {/* Header Hero */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white text-4xl font-black tracking-tighter italic uppercase">Match Center</Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-accent-cyan mr-2 animate-pulse" />
            <Text className="text-gray-500 font-bold text-xs uppercase tracking-widest">Live Schedule 2026</Text>
          </View>
        </View>

        {/* Proximo Partido Hero Card */}
        {proximoPartido && (
          <View className="px-4 mb-8">
            <View
              className="bg-surface rounded-[32px] p-6 border border-accent-cyan/20 overflow-hidden shadow-2xl shadow-accent-cyan/10"
            >
              <View className="flex-row justify-between items-center mb-6">
                <View className="bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30">
                  <Text className="text-accent-cyan font-black text-[10px] uppercase">Próximo Match • W{proximoPartido.semana}</Text>
                </View>
                <View className="flex-row items-center">
                  <Clock color="#4B5563" size={14} />
                  <Text className="text-gray-400 font-bold text-xs ml-1">{formatCountdown(proximoPartido.fecha)}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-around py-2">
                <View className="items-center flex-1">
                  <Image source={{ uri: proximoPartido.team1Logo }} className="w-16 h-16" resizeMode="contain" />
                  <Text className="text-white font-black mt-2 text-lg">{proximoPartido.team1Abrev}</Text>
                </View>

                <View className="items-center px-4">
                  <View className="w-10 h-10 bg-midnight rounded-full items-center justify-center border border-white/5">
                    <Text className="text-gray-600 font-black italic">VS</Text>
                  </View>
                </View>

                <View className="items-center flex-1">
                  <Image source={{ uri: proximoPartido.team2Logo }} className="w-16 h-16" resizeMode="contain" />
                  <Text className="text-white font-black mt-2 text-lg">{proximoPartido.team2Abrev}</Text>
                </View>
              </View>

              <View className="mt-6 pt-4 border-t border-white/5 items-center">
                <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-[3px]">
                  {formatFechaExtensa(proximoPartido.fecha)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View className="px-6">
          {calendario.map((jornada, jIdx) => (
            <View key={jornada.semana} className="mb-10">
              <View className="flex-row items-center mb-6">
                <Text className="text-white font-black text-2xl italic uppercase tracking-tighter">Semana {jornada.semana || (jIdx + 1)}</Text>
                <View className="flex-1 h-[1px] bg-accent-cyan/20 ml-4" />
              </View>

              {jornada.dias.map((dia, dIdx) => {
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

                    {dia.partidos.map((partido, pIdx) => {
                      const isPlayed = !!partido.winTeam;
                      return (
                        <View
                          key={partido.gameId}
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
                                <Text className="text-accent-cyan font-black text-sm">{new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
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
                    })}
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
