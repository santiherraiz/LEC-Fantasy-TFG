import React, { useState, useCallback, useEffect } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../src/api/api';
import { RankingEntry, Jornada } from '../../../src/types';
import { useAuthStore } from '../../../src/store/authStore';
import { Trophy, Medal, Globe } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

export default function RankingScreen() {
  const { user, selectedLigaId } = useAuthStore();
  const params = useLocalSearchParams();
  const router = useRouter();

  // Estados locales para evitar dependencias de ciclos de navegación
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // El ID activo se deriva de los parámetros de la URL o se mantiene null (Global)
  const jornadaParam = params.jornadaId as string | undefined;
  const activeId = (jornadaParam === 'null' || !jornadaParam) ? null : parseInt(jornadaParam, 10);

  // 1. Efecto de seguridad para asegurar que el contexto de navegación está listo
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // 2. Carga inicial de las jornadas (solo una vez)
  const fetchJornadas = useCallback(async () => {
    if (!selectedLigaId) return;
    try {
      const res = await api.get('/jornadas');
      const data = Array.isArray(res.data) ? res.data : [];
      const validJornadas = data
        .filter((j: any) => j && j.estado !== 'PROGRAMADA')
        .sort((a: any, b: any) => a.numeroSemana - b.numeroSemana);
      setJornadas(validJornadas);
    } catch (e) {
      console.error("Error al cargar jornadas:", e);
      setJornadas([]);
    }
  }, [selectedLigaId]);

  // 3. Carga del ranking según la jornada seleccionada
  const fetchRanking = useCallback(async (jId: number | null) => {
    if (!selectedLigaId) return;
    setLoading(true);
    try {
      const res = await api.get('/equipos/ranking', {
        params: { ligaId: selectedLigaId, jornadaId: jId }
      });
      setRanking(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error al cargar ranking:", e);
      setRanking([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLigaId]);

  // 4. Lógica de inicialización
  useEffect(() => {
    if (!isReady || !selectedLigaId) return;

    fetchJornadas();

    // Si entramos sin parámetro, buscamos la jornada actual pero sin forzar redirect
    if (jornadaParam === undefined) {
      api.get('/jornadas/actual').then(res => {
        const actual = res.data;
        if (actual && ['BLOQUEADA', 'PROCESANDO', 'FINALIZADA'].includes(actual.estado)) {
          fetchRanking(actual.id);
        } else {
          fetchRanking(null);
        }
      }).catch(() => fetchRanking(null));
    } else {
      fetchRanking(activeId);
    }
  }, [isReady, selectedLigaId, jornadaParam]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJornadas();
    fetchRanking(activeId);
  }, [activeId, fetchJornadas, fetchRanking]);

  const handleWeekSelect = (idStr: string) => {
    try {
      router.setParams({ jornadaId: idStr });
    } catch (e) {
      console.warn("Error al actualizar parámetros:", e);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy color="#FFD700" size={24} />;
    if (index === 1) return <Medal color="#94a3b8" size={24} />;
    if (index === 2) return <Medal color="#CD7F32" size={24} />;
    return <Text className="text-gray-500 font-bold text-lg">{index + 1}</Text>;
  };

  if (!isReady) {
    return <View className="flex-1 bg-midnight" />;
  }

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />
      
      {/* Selector de Semanas */}
      <View className="bg-surface/30 py-4 border-b border-surface-light/10">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4"
          contentContainerStyle={{ paddingRight: 32 }}
        >
          <TouchableOpacity
            onPress={() => handleWeekSelect('null')}
            className={`px-6 py-2.5 rounded-2xl mr-3 border flex-row items-center ${activeId === null ? 'bg-accent-cyan border-accent-cyan' : 'bg-surface border-surface-light/20'}`}
          >
            <Globe size={14} color={activeId === null ? '#0B0E14' : '#94a3b8'} />
            <Text className={`ml-2 font-black text-[11px] uppercase tracking-widest ${activeId === null ? 'text-midnight' : 'text-gray-400'}`}>Global</Text>
          </TouchableOpacity>

          {(jornadas || []).map((j) => (
            j && (
              <TouchableOpacity
                key={`semana-btn-${j.id}`}
                onPress={() => handleWeekSelect(j.id.toString())}
                className={`px-6 py-2.5 rounded-2xl mr-3 border ${activeId === j.id ? 'bg-accent-cyan border-accent-cyan' : 'bg-surface border-surface-light/20'}`}
              >
                <Text className={`font-black text-[11px] uppercase tracking-widest ${activeId === j.id ? 'text-midnight' : 'text-gray-400'}`}>Semana {j.numeroSemana}</Text>
              </TouchableOpacity>
            )
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        className="px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-8 mt-6">
          <Text className="text-white text-3xl font-black tracking-tight italic uppercase">
            Ranking {activeId === null ? 'General' : `Semanal`}
          </Text>
          {activeId !== null && (
            <View className="bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30">
              <Text className="text-accent-cyan font-black text-[10px] uppercase tracking-widest">Snapshot</Text>
            </View>
          )}
        </View>
        
        {loading && !refreshing ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#00D1FF" />
          </View>
        ) : (
          <View>
            {ranking.length > 0 ? (
              ranking.map((entry, index) => {
                const isOwnTeam = entry.nombreUsuario === user?.nickname;
                return entry && (
                  <TouchableOpacity 
                    key={`rank-item-${entry.equipoId || index}`} 
                    onPress={() => {
                      if (isOwnTeam) {
                        router.push(`/(main)/equipo-jornada/${entry.equipoId}`);
                      } else {
                        router.push(`/(main)/rival/${entry.equipoId}`);
                      }
                    }}
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
              })
            ) : (
              <View className="items-center pt-20">
                <Text className="text-gray-500 italic font-bold text-center">No hay datos disponibles para esta selección.</Text>
                <Text className="text-gray-600 text-[10px] uppercase tracking-widest mt-2">Los resultados se calculan al cerrar la jornada</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
