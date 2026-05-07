import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/api/api';
import { Trophy, Plus, Link as LinkIcon, ChevronRight, LogOut } from 'lucide-react-native';

export default function LeagueSelectionScreen() {
  const { user, setSelectedLiga, logout } = useAuthStore();
  const [ligas, setLigas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nombreLiga, setNombreLiga] = useState('');

  const fetchLigas = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/usuarios/${user.id}/mis-ligas`);
      setLigas(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLigas();
  }, []);

  const handleCreate = async () => {
    if (!nombreLiga) return;
    try {
      await api.post('/ligas/crear', { nombre: nombreLiga, adminId: user?.id });
      Alert.alert('Éxito', 'Liga creada correctamente');
      setNombreLiga('');
      setShowCreate(false);
      fetchLigas();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la liga');
    }
  };

  const handleJoin = async () => {
    if (!codigo) return;
    try {
      await api.post('/ligas/unirse', { codigoAcceso: codigo, usuarioId: user?.id });
      Alert.alert('Éxito', 'Te has unido a la liga');
      setCodigo('');
      setShowJoin(false);
      fetchLigas();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Código inválido o ya estás en la liga');
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-midnight">
      <View className="flex-row items-center px-5 py-6 border-b border-surface-light/20">
        <View className="flex-1">
          <Text className="text-white text-3xl font-black tracking-tight uppercase italic">Mis Ligas</Text>
          <Text className="text-gray-500 text-xs font-bold mt-1">Elige tu competición</Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-3 bg-crimson/10 rounded-xl border border-crimson/20">
          <LogOut color="#FF003F" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchLigas();}} tintColor="#00D1FF" />}
      >
        <View className="mt-6 mb-8">
          {ligas.map((liga) => (
            <TouchableOpacity 
              key={liga.id} 
              className="bg-surface p-5 rounded-2xl flex-row items-center mb-4 border border-surface-light/30 shadow-xl"
              onPress={() => setSelectedLiga(liga.id, liga.nombre)}
            >
              <View className="w-12 h-12 bg-midnight rounded-xl items-center justify-center mr-4 border border-surface-light/50">
                <Trophy color="#00D1FF" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-bold">{liga.nombre}</Text>
                <Text className="text-gray-500 text-[10px] font-bold tracking-widest mt-1">CÓDIGO: {liga.codigoAcceso}</Text>
              </View>
              <ChevronRight color="#4A5568" size={20} />
            </TouchableOpacity>
          ))}

          {ligas.length === 0 && (
            <View className="items-center py-10 border border-dashed border-surface-light/30 rounded-3xl">
              <Text className="text-gray-600 italic">Aún no estás en ninguna liga.</Text>
            </View>
          )}
        </View>

        <View className="mb-10">
          <TouchableOpacity 
            className="flex-row items-center justify-center bg-surface-light/30 p-5 rounded-2xl border border-surface-light/30"
            onPress={() => { setShowJoin(!showJoin); setShowCreate(false); }}
          >
            <LinkIcon color="white" size={20} className="mr-3" />
            <Text className="text-white font-bold text-base uppercase tracking-tighter">Unirse con Código</Text>
          </TouchableOpacity>

          {showJoin && (
            <View className="bg-surface p-5 rounded-2xl mt-3 border border-accent-cyan/20">
              <TextInput 
                className="bg-midnight text-white p-4 rounded-xl mb-4 border border-surface-light/50 font-medium"
                placeholder="Código de acceso..."
                placeholderTextColor="#4A5568"
                value={codigo}
                onChangeText={setCodigo}
                autoCapitalize="characters"
              />
              <TouchableOpacity className="bg-accent-cyan p-4 rounded-xl items-center" onPress={handleJoin}>
                <Text className="text-midnight font-black uppercase">Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            className="flex-row items-center justify-center bg-accent-cyan p-5 rounded-2xl mt-4 shadow-lg shadow-accent-cyan/20"
            onPress={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          >
            <Plus color="#0B0E14" size={20} className="mr-3" />
            <Text className="text-midnight font-black text-base uppercase tracking-tighter">Crear Nueva Liga</Text>
          </TouchableOpacity>

          {showCreate && (
            <View className="bg-surface p-5 rounded-2xl mt-3 border border-accent-cyan/20">
              <TextInput 
                className="bg-midnight text-white p-4 rounded-xl mb-4 border border-surface-light/50 font-medium"
                placeholder="Nombre de la liga..."
                placeholderTextColor="#4A5568"
                value={nombreLiga}
                onChangeText={setNombreLiga}
              />
              <TouchableOpacity className="bg-accent-cyan p-4 rounded-xl items-center" onPress={handleCreate}>
                <Text className="text-midnight font-black uppercase">Crear Liga</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
