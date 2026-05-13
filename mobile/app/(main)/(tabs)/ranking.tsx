import React from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Globe } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';
import { RankingItem } from '../../../src/components/RankingItem';
import { useRanking } from '../../../src/hooks/useRanking';

export default function RankingScreen() {
  const {
    user,
    jornadas,
    ranking,
    loading,
    refreshing,
    isReady,
    activeId,
    onRefresh,
    handleWeekSelect,
    navigateToDetail
  } = useRanking();

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

          {jornadas.map((j) => (
            <TouchableOpacity
              key={`semana-btn-${j.id}`}
              onPress={() => handleWeekSelect(j.id.toString())}
              className={`px-6 py-2.5 rounded-2xl mr-3 border ${activeId === j.id ? 'bg-accent-cyan border-accent-cyan' : 'bg-surface border-surface-light/20'}`}
            >
              <Text className={`font-black text-[11px] uppercase tracking-widest ${activeId === j.id ? 'text-midnight' : 'text-gray-400'}`}>Semana {j.numeroSemana}</Text>
            </TouchableOpacity>
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
              ranking.map((entry, index) => (
                <RankingItem 
                  key={`rank-item-${entry.equipoId || index}`}
                  entry={entry}
                  index={index}
                  isOwnTeam={entry.nombreUsuario === user?.nickname}
                  onPress={() => navigateToDetail(entry)}
                />
              ))
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
