import React, { useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { Search, TrendingUp, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';
import { CatalogoCard } from '../../../src/components/CatalogoCard';
import { useCatalogo } from '../../../src/hooks/useCatalogo';
import { CatalogoJugador } from '../../../src/types';

export default function CatalogoScreen() {
  const {
    user,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    activeTab,
    filterPos,
    filterTeam,
    sortType,
    sortOrder,
    availableTeams,
    availablePositions,
    filteredCatalogo,
    handleRefresh,
    toggleSort,
    toggleFilterTab,
    setPosition,
    setTeam
  } = useCatalogo();

  const renderJugador = useCallback(({ item }: { item: CatalogoJugador }) => (
    <CatalogoCard 
      item={item} 
      isOwnPlayer={item.propietarioNickname === user?.nickname} 
    />
  ), [user?.nickname]);

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader />

      {/* Contenedor de cabecera y filtros fijo arriba */}
      <View className="px-4 pt-4 pb-2 z-10">
        <Text className="text-white text-3xl font-black tracking-tighter mb-5 italic">CATÁLOGO</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface p-3.5 rounded-2xl border border-surface-light/30 mb-5">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-white font-bold"
            placeholder="Buscar por nickname..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Filter Section */}
        <View className="mb-2">
          {/* GRUPO ORDENAR - Cabecera */}
          <View className="flex-row items-center mb-1.5 px-1">
            <TrendingUp size={12} color="#818CF8" />
            <Text className="ml-2 text-indigo-400 text-[10px] font-black uppercase tracking-[2px]">Ordenar</Text>
            <View className="flex-1 h-[1px] bg-indigo-500/20 ml-3" />
          </View>

          <View className="flex-row mb-3">
            <TouchableOpacity
              onPress={() => toggleSort('PUNTOS')}
              className={`flex-1 py-2 rounded-xl mr-2 flex-row items-center justify-center border ${sortType === 'PUNTOS' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-xs ${sortType === 'PUNTOS' ? 'text-indigo-400' : 'text-gray-400'}`}>
                PUNTOS
              </Text>
              {sortType === 'PUNTOS' && (
                <View className="ml-1.5">
                  {sortOrder === 'MAYOR' ? <ChevronDown size={14} color="#818CF8" /> : <ChevronUp size={14} color="#818CF8" />}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleSort('PRECIO')}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center border ${sortType === 'PRECIO' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-xs ${sortType === 'PRECIO' ? 'text-indigo-400' : 'text-gray-400'}`}>
                PRECIO
              </Text>
              {sortType === 'PRECIO' && (
                <View className="ml-1.5">
                  {sortOrder === 'MAYOR' ? <ChevronDown size={14} color="#818CF8" /> : <ChevronUp size={14} color="#818CF8" />}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* GRUPO FILTRAR - Cabecera */}
          <View className="flex-row items-center mb-1.5 px-1">
            <Search size={12} color="#00D1FF" />
            <Text className="ml-2 text-accent-cyan text-[10px] font-black uppercase tracking-[2px]">Filtrar</Text>
            <View className="flex-1 h-[1px] bg-accent-cyan/20 ml-3" />
          </View>

          <View className="flex-row mb-2">
            <TouchableOpacity
              onPress={() => toggleFilterTab('POSICION')}
              className={`flex-1 py-2 rounded-xl mr-2 flex-row items-center justify-center border ${activeTab === 'POSICION' ? 'bg-accent-cyan/10 border-accent-cyan' : filterPos ? 'bg-accent-cyan/5 border-accent-cyan/30' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-[11px] ${activeTab === 'POSICION' || filterPos ? 'text-accent-cyan' : 'text-gray-400'}`}>
                {filterPos?.toUpperCase() === 'SUPPORT' ? 'SUPP' : (filterPos?.toUpperCase() || 'POSICIÓN')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFilterTab('EQUIPO')}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center border ${activeTab === 'EQUIPO' ? 'bg-accent-cyan/10 border-accent-cyan' : filterTeam ? 'bg-accent-cyan/5 border-accent-cyan/30' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-[11px] ${activeTab === 'EQUIPO' || filterTeam ? 'text-accent-cyan' : 'text-gray-400'}`}>
                {filterTeam ? (filterTeam.length > 10 ? filterTeam.substring(0, 8) + '...' : filterTeam.toUpperCase()) : 'EQUIPO'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sub-options based on selected Tab */}
          {activeTab && (
            <View className="bg-surface/50 p-2 rounded-2xl border border-surface-light/10 mb-4 mx-1">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {activeTab === 'POSICION' && (
                  <>
                    <TouchableOpacity
                      onPress={() => setPosition(null)}
                      className={`px-4 py-2 rounded-lg mr-2 border ${filterPos === null ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${filterPos === null ? 'text-accent-cyan' : 'text-gray-400'}`}>TODAS</Text>
                    </TouchableOpacity>
                    {availablePositions.map(pos => (
                      <TouchableOpacity
                        key={pos}
                        onPress={() => setPosition(pos)}
                        className={`px-4 py-2 rounded-lg mr-2 border ${filterPos === pos ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                      >
                        <Text className={`font-bold text-xs ${filterPos === pos ? 'text-accent-cyan' : 'text-gray-400'}`}>
                          {pos.toUpperCase() === 'SUPPORT' ? 'SUPP' : pos.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {activeTab === 'EQUIPO' && (
                  <>
                    <TouchableOpacity
                      onPress={() => setTeam(null)}
                      className={`px-4 py-2 rounded-lg mr-2 border ${filterTeam === null ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${filterTeam === null ? 'text-accent-cyan' : 'text-gray-400'}`}>TODOS</Text>
                    </TouchableOpacity>
                    {availableTeams.map(team => (
                      <TouchableOpacity
                        key={team}
                        onPress={() => setTeam(team)}
                        className={`px-4 py-2 rounded-lg mr-2 border ${filterTeam === team ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                      >
                        <Text className={`font-bold text-xs ${filterTeam === team ? 'text-accent-cyan' : 'text-gray-400'}`}>{team.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* List content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00D1FF" />
        </View>
      ) : (
        <FlatList
          data={filteredCatalogo}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJugador}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00D1FF"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 italic text-center">No se encontraron jugadores con esos filtros</Text>
            </View>
          }
        />
      )}
    </View>
  );
}