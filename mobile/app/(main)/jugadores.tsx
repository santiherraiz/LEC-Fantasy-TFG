import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';

import { useJugadoresRanking } from '../../src/hooks/useJugadoresRanking';
import { RankingPlayerItem } from '../../src/components/RankingPlayerItem';
import CustomHeader from '../../src/components/CustomHeader';

export default function JugadoresListScreen() {
  const router = useRouter();
  const {
    ranking,
    loading,
    refreshing,
    onRefresh
  } = useJugadoresRanking();

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
        renderItem={({ item, index }) => <RankingPlayerItem item={item} index={index} />}
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
