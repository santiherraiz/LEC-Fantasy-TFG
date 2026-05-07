import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../../src/api/api';
import { RankingEntry } from '../../../src/types';
import { useAuthStore } from '../../../src/store/authStore';
import { Trophy, Medal } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

export default function RankingScreen() {
  const router = useRouter();
  const { selectedLigaId } = useAuthStore();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    if (!selectedLigaId) return;
    try {
      const response = await api.get('/equipos/ranking', {
        params: { ligaId: selectedLigaId }
      });
      setRanking(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [selectedLigaId]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy color="#FFD700" size={24} />;
    if (index === 1) return <Medal color="#94a3b8" size={24} />;
    if (index === 2) return <Medal color="#CD7F32" size={24} />;
    return <Text className="text-gray-500 font-bold text-lg">{index + 1}</Text>;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  const safeRanking = ranking || [];

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />
      <ScrollView 
        className="px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchRanking();}} tintColor="#00D1FF" />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-3xl font-black tracking-tight mb-8 mt-6 italic uppercase">Ranking de la Liga</Text>
        
        <View>
          {safeRanking.map((entry, index) => (
            <TouchableOpacity 
              key={entry.equipoId ? entry.equipoId.toString() : `rank-${index}`} 
              onPress={() => router.push(`/(main)/rival/${entry.equipoId}`)}
              activeOpacity={0.7}
              className={`bg-surface p-5 rounded-2xl flex-row items-center mb-3 border border-surface-light/20 ${index === 0 ? 'border-accent-cyan/30' : ''}`}
            >
              <View className="w-10 items-center mr-4">{getRankIcon(index)}</View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{entry.nombreUsuario || 'Usuario'}</Text>
                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Entrenador</Text>
              </View>
              <View className="items-end">
                <Text className="text-accent-cyan font-black text-xl">{Math.round(entry.puntosTotales ?? 0)}</Text>
                <Text className="text-gray-500 text-[10px] font-bold">PTS</Text>
              </View>
            </TouchableOpacity>
          ))}
          {safeRanking.length === 0 && !loading && (
            <View className="items-center pt-20">
              <Text className="text-gray-600 italic">No hay datos en esta liga.</Text>
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
