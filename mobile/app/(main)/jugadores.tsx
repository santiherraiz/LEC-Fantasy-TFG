import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import api from '../../src/api/api';
import { JugadorPuntuacionTotal } from '../../src/types';
import { ChevronRight, Medal } from 'lucide-react-native';
import CustomHeader from '../../src/components/CustomHeader';

export default function JugadoresListScreen() {
  const router = useRouter();
  const [ranking, setRanking] = useState<JugadorPuntuacionTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      const response = await api.get('/jugadores/ranking');
      setRanking(response.data);
    } catch (error) {
      console.error("Error fetching player ranking:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanking();
  };

  const renderItem = ({ item, index }: { item: JugadorPuntuacionTotal; index: number }) => (
    <Link href={`/jugador/${item.jugador.id}`} asChild>
      <TouchableOpacity 
        className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center border border-surface-light/50"
      >
        <View className="w-10 items-center justify-center mr-3">
          {index < 3 ? (
            <Medal color={index === 0 ? '#FFD700' : index === 1 ? '#9CA3AF' : '#CD7F32'} size={24} />
          ) : (
            <Text className="text-gray-500 font-bold text-lg">{index + 1}</Text>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{item.jugador.nickname}</Text>
          <View className="flex-row items-center mt-1">
            {item.jugador.equipoLec?.logoUrl && (
              <Image 
                source={{ uri: item.jugador.equipoLec.logoUrl }} 
                className="w-4 h-4 mr-2"
                resizeMode="contain"
              />
            )}
            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
              {item.jugador.equipoLec?.nombre} • {item.jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : item.jugador.rol}
            </Text>
          </View>
        </View>

        <View className="items-end mr-3">
          <Text className="text-accent-cyan text-xl font-bold">{Math.round(item.puntosTotales)}</Text>
          <Text className="text-gray-500 text-[10px] font-bold tracking-tighter">PTS</Text>
        </View>

        <ChevronRight color="#4B5563" size={20} />
      </TouchableOpacity>
    </Link>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader 
        showBackButton={true} 
        onBackPress={() => router.push('/equipo')} 
      />
      <FlatList
        data={ranking}
        renderItem={renderItem}
        keyExtractor={(item) => item.jugador.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />
        }
        ListHeaderComponent={() => (
          <Text className="text-white text-3xl font-black mb-6 tracking-tight italic uppercase">Ranking Global</Text>
        )}
      />
    </View>
  );
}
