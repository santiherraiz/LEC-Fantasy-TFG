import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, TextInput, FlatList } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useToast } from '../../../src/context/ToastContext';
import api from '../../../src/api/api';
import { CatalogoJugador } from '../../../src/types';
import { Search, TrendingUp, User as UserIcon, Shield, ChevronDown, ChevronUp, X, Zap } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

export default function CatalogoScreen() {
  const router = useRouter();
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [catalogo, setCatalogo] = useState<CatalogoJugador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'PUNTOS' | 'POSICION' | 'EQUIPO' | null>(null);
  const [filterPos, setFilterPos] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'MAYOR' | 'MENOR'>('MAYOR');

  // Extract unique teams and positions from data dynamically
  const availableTeams = useMemo(() => {
    const teams = catalogo.map(item => item.jugador.equipoLec?.nombre).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [catalogo]);

  const availablePositions = useMemo(() => {
    const positions = catalogo.map(item => item.jugador.rol).filter(Boolean);
    return Array.from(new Set(positions)).sort();
  }, [catalogo]);

  const fetchData = async () => {
    if (!user?.id || !selectedLigaId) return;
    setLoading(true);
    try {
      const res = await api.get('/mercado/catalogo', { params: { ligaId: selectedLigaId } });
      setCatalogo(res.data);
    } catch (error) {
      console.error("Error cargando catálogo:", error);
      showToast("Error al cargar catálogo", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLigaId]);

  // Derived filtered data
  const filteredCatalogo = useMemo(() => {
    let result = [...catalogo];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.jugador.nickname.toLowerCase().includes(query)
      );
    }

    // 2. Position Filter
    if (filterPos) {
      result = result.filter(item => item.jugador.rol === filterPos);
    }

    // 3. Team Filter
    if (filterTeam) {
      result = result.filter(item => item.jugador.equipoLec?.nombre === filterTeam);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const puntosA = a.puntosTotales || 0;
      const puntosB = b.puntosTotales || 0;
      return sortOrder === 'MAYOR'
        ? puntosB - puntosA
        : puntosA - puntosB;
    });

    return result;
  }, [catalogo, searchQuery, filterPos, filterTeam, sortOrder]);

  // Renderizado optimizado para el FlatList
  const renderJugador = useCallback(({ item }: { item: CatalogoJugador }) => (
    <Link href={`/jugador/${item.jugador.id}`} asChild>
      <TouchableOpacity className="bg-surface rounded-2xl mb-4 border border-surface-light/20 overflow-hidden shadow-sm">
        <View className="p-4 flex-row items-center">

          {/* Avatar y Posición */}
          <View className="relative">
            <View className="w-24 h-24 bg-midnight/50 rounded-3xl items-center justify-center border border-surface-light/20 overflow-hidden shadow-inner">
              
              {item.jugador.imagenUrl ? (
                <Image 
                  source={{ uri: item.jugador.imagenUrl }} 
                  className="w-24 h-24" 
                  style={{ marginTop: 12 }}
                  resizeMode="contain" 
                />
              ) : (
                <UserIcon size={32} color="#00D1FF" />
              )}
            </View>

            {/* ESCUDO FLOTANTE: Logo limpio sin fondo circular */}
            {item.jugador.equipoLec?.logoUrl && (
              <View className="absolute top-1 left-1">
                <Image 
                  source={{ uri: item.jugador.equipoLec.logoUrl }} 
                  className="w-7 h-7" 
                  resizeMode="contain" 
                />
              </View>
            )}
          </View>

          {/* Info principal */}
          <View className="ml-6 flex-1 justify-center">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-white font-black text-xl tracking-tight mr-3">{item.jugador.nickname}</Text>
              
              {/* CHIP DE POSICIÓN: Ahora junto al nombre, más elegante */}
              <View className="bg-accent-cyan/10 border border-accent-cyan/40 px-2 py-0.5 rounded-md">
                <Text className="text-accent-cyan font-black text-[9px] uppercase italic">
                  {item.jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : item.jugador.rol}
                </Text>
              </View>
            </View>
            
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">
              {item.jugador.equipoLec?.nombre || 'Sin equipo'}
            </Text>

            <View className="flex-row items-center">
              {item.propietarioNickname ? (
                <View className={`flex-row items-center px-2 py-1 rounded-md ${item.propietarioNickname === user?.nickname ? 'bg-accent-cyan/10 border border-accent-cyan/20' : 'bg-surface-light/20'}`}>
                  {item.propietarioNickname !== user?.nickname && <Zap size={10} color="#FB7185" className="mr-1" />}
                  <Text className={`${item.propietarioNickname === user?.nickname ? 'text-accent-cyan' : 'text-gray-300'} text-[10px] font-black uppercase`}>
                    {item.propietarioNickname === user?.nickname ? 'MÍO' : item.propietarioNickname}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                  <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-wide">LIBRE</Text>
                </View>
              )}
            </View>
          </View>

          {/* Puntos: Diseño puramente tipográfico y elegante */}
          <View className="items-end justify-center">
            <View className="bg-accent-cyan/5 px-3 py-2 rounded-2xl border border-accent-cyan/10 items-center">
              <Text className="text-accent-cyan font-black text-2xl tracking-tighter">
                {Math.round(item.puntosTotales)}
              </Text>
              <Text className="text-accent-cyan/60 text-[8px] font-black uppercase tracking-[2px] -mt-1">
                PTS
              </Text>
            </View>
          </View>
        </View>

        {/* Footer: Valor de mercado */}
        <View className="bg-midnight/60 px-4 py-3 flex-row items-center justify-between border-t border-surface-light/10">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Valor de mercado</Text>
          <Text className="text-emerald-400 font-black text-base">{item.jugador.precioBase.toLocaleString()} €</Text>
        </View>
      </TouchableOpacity>
    </Link>
  ), []);

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
            <TouchableOpacity
              onPress={() => setActiveTab(activeTab === 'PUNTOS' ? null : 'PUNTOS')}
              className={`px-4 py-2.5 rounded-xl mr-3 flex-row items-center border ${activeTab === 'PUNTOS' ? 'bg-accent-cyan/10 border-accent-cyan' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-xs ${activeTab === 'PUNTOS' ? 'text-accent-cyan' : 'text-gray-400'}`}>PUNTOS</Text>
              {activeTab === 'PUNTOS' ? <ChevronUp size={14} color="#00D1FF" style={{ marginLeft: 6 }} /> : <ChevronDown size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab(activeTab === 'POSICION' ? null : 'POSICION')}
              className={`px-4 py-2.5 rounded-xl mr-3 flex-row items-center border ${activeTab === 'POSICION' ? 'bg-accent-cyan/10 border-accent-cyan' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-xs ${activeTab === 'POSICION' ? 'text-accent-cyan' : 'text-gray-400'}`}>
                {filterPos?.toUpperCase() === 'SUPPORT' ? 'SUPP' : (filterPos?.toUpperCase() || 'POSICIÓN')}
              </Text>
              {activeTab === 'POSICION' ? <ChevronUp size={14} color="#00D1FF" style={{ marginLeft: 6 }} /> : <ChevronDown size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab(activeTab === 'EQUIPO' ? null : 'EQUIPO')}
              className={`px-4 py-2.5 rounded-xl mr-3 flex-row items-center border ${activeTab === 'EQUIPO' ? 'bg-accent-cyan/10 border-accent-cyan' : 'bg-surface border-surface-light/30'}`}
            >
              <Text className={`font-black text-xs ${activeTab === 'EQUIPO' ? 'text-accent-cyan' : 'text-gray-400'}`}>
                {filterTeam ? (filterTeam.length > 10 ? filterTeam.substring(0, 8) + '...' : filterTeam.toUpperCase()) : 'EQUIPO'}
              </Text>
              {activeTab === 'EQUIPO' ? <ChevronUp size={14} color="#00D1FF" style={{ marginLeft: 6 }} /> : <ChevronDown size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </ScrollView>

          {/* Sub-options based on selected Tab */}
          {activeTab && (
            <View className="bg-surface p-3 rounded-2xl border border-surface-light/20 mb-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {activeTab === 'PUNTOS' && (
                  <>
                    <TouchableOpacity
                      onPress={() => { setSortOrder('MAYOR'); setActiveTab(null); }}
                      className={`px-4 py-2 rounded-lg mr-2 border ${sortOrder === 'MAYOR' ? 'bg-emerald-500/10 border-emerald-500/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${sortOrder === 'MAYOR' ? 'text-emerald-400' : 'text-gray-400'}`}>MAYOR A MENOR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setSortOrder('MENOR'); setActiveTab(null); }}
                      className={`px-4 py-2 rounded-lg mr-2 border ${sortOrder === 'MENOR' ? 'bg-emerald-500/10 border-emerald-500/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${sortOrder === 'MENOR' ? 'text-emerald-400' : 'text-gray-400'}`}>MENOR A MAYOR</Text>
                    </TouchableOpacity>
                  </>
                )}

                {activeTab === 'POSICION' && (
                  <>
                    <TouchableOpacity
                      onPress={() => { setFilterPos(null); setActiveTab(null); }}
                      className={`px-4 py-2 rounded-lg mr-2 border ${filterPos === null ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${filterPos === null ? 'text-accent-cyan' : 'text-gray-400'}`}>TODAS</Text>
                    </TouchableOpacity>
                    {availablePositions.map(pos => (
                      <TouchableOpacity
                        key={pos}
                        onPress={() => { setFilterPos(pos); setActiveTab(null); }}
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
                      onPress={() => { setFilterTeam(null); setActiveTab(null); }}
                      className={`px-4 py-2 rounded-lg mr-2 border ${filterTeam === null ? 'bg-accent-cyan/10 border-accent-cyan/50' : 'border-surface-light/20'}`}
                    >
                      <Text className={`font-bold text-xs ${filterTeam === null ? 'text-accent-cyan' : 'text-gray-400'}`}>TODOS</Text>
                    </TouchableOpacity>
                    {availableTeams.map(team => (
                      <TouchableOpacity
                        key={team}
                        onPress={() => { setFilterTeam(team); setActiveTab(null); }}
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

      {/* Uso de FlatList en lugar de ScrollView + Map para rendimiento drástico */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00D1FF" />
        </View>
      ) : (
        <FlatList
          data={filteredCatalogo}
          keyExtractor={(item) => item.jugador.id.toString()}
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
              onRefresh={() => { setRefreshing(true); fetchData(); }}
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