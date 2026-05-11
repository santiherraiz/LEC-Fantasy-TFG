import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Trophy, DollarSign, Zap } from 'lucide-react-native';
import api from '../../../src/api/api';
import { EquipoRivalDTO } from '../../../src/types';
import { useAuthStore } from '../../../src/store/authStore';

export default function RivalTeamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [equipo, setEquipo] = useState<EquipoRivalDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipoRival();
  }, [id]);

  const fetchEquipoRival = async () => {
    try {
      const response = await api.get(`/equipos/rival/${id}`);
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching rival team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClausulazo = async (jugadorId: number, nickname: string, precioBase: number, precioActual: number) => {
    const { user, selectedLigaId } = useAuthStore.getState();
    if (!user || !selectedLigaId) return;

    const precioFinal = precioActual || precioBase;
    const precioClausula = precioFinal * 1.5;
    
    const confirm = await new Promise((resolve) => {
      import('react-native').then(({ Alert }) => {
        Alert.alert(
          '¡CLAUSULAZO!',
          `¿Estás seguro de que quieres pagar la cláusula de ${nickname} por ${precioClausula.toLocaleString()} €?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'PAGAR', style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      });
    });

    if (!confirm) return;

    try {
      setLoading(true);
      await api.post('/mercado/clausulazo', {
        compradorUsuarioId: user.id,
        jugadorId: jugadorId,
        ligaId: selectedLigaId
      });
      
      import('react-native').then(({ Alert }) => {
        Alert.alert('Éxito', `¡Has robado a ${nickname} con éxito!`);
      });
      
      fetchEquipoRival();
    } catch (error: any) {
      import('react-native').then(({ Alert }) => {
        Alert.alert('Error', error.response?.data || 'No se pudo ejecutar el clausulazo');
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // ... (mismo loading)
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!equipo) return null;

  const titulares = equipo.jugadores.filter(j => j.estado === 'TITULAR');
  const banquillo = equipo.jugadores.filter(j => j.estado === 'BANQUILLO');

  return (
    <View className="flex-1 bg-midnight">
      <SafeAreaView edges={['top']} className="bg-surface p-4 flex-row items-center border-b border-surface-light/20">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View>
          <Text className="text-white font-black text-xl italic uppercase tracking-tighter">
            Equipo de {equipo.nombreUsuario}
          </Text>
          <Text className="text-gray-400 text-xs font-bold tracking-widest uppercase">
            Scouting Report
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Stats Header */}
        <View className="flex-row mt-6 mb-8 justify-between">
          <View className="bg-surface p-4 rounded-3xl items-center flex-1 mr-2 border border-surface-light/10">
            <Trophy color="#FFD700" size={24} />
            <Text className="text-white font-black text-2xl mt-1">{Math.round(equipo.puntosTotales)}</Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase">Puntos Totales</Text>
          </View>
          <View className="bg-surface p-4 rounded-3xl items-center flex-1 ml-2 border border-surface-light/10">
            <DollarSign color="#00D1FF" size={24} />
            <Text className="text-white font-black text-2xl mt-1">{equipo.presupuesto.toLocaleString()} €</Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase">Presupuesto</Text>
          </View>
        </View>

        {/* Titulares Section */}
        <Text className="text-white font-black text-xl italic uppercase mb-4 tracking-tight">Titulares</Text>
        <View className="space-y-3 mb-8">
          {titulares.map(jugador => (
            <JugadorCard key={jugador.id} jugador={jugador} onClausulazo={handleClausulazo} />
          ))}
          {titulares.length === 0 && (
            <Text className="text-gray-600 italic text-center py-4">No tiene titulares alineados.</Text>
          )}
        </View>

        {/* Banquillo Section */}
        <Text className="text-white font-black text-xl italic uppercase mb-4 tracking-tight">Banquillo</Text>
        <View className="space-y-3 mb-10">
          {banquillo.map(jugador => (
            <JugadorCard key={jugador.id} jugador={jugador} onClausulazo={handleClausulazo} />
          ))}
          {banquillo.length === 0 && (
            <Text className="text-gray-600 italic text-center py-4">Banquillo vacío.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function JugadorCard({ jugador, onClausulazo }: { jugador: any, onClausulazo: (id: number, nick: string, precioBase: number, precioActual: number) => void }) {
  const router = useRouter();
  const { ChevronUp, ChevronDown } = require('lucide-react-native');

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/(main)/jugador/${jugador.id}`)}
      className="bg-surface p-4 rounded-3xl flex-row items-center border border-surface-light/20 mb-3"
    >
      <View className="w-20 h-20 bg-midnight rounded-3xl items-center justify-center mr-5 overflow-hidden border border-surface-light/20 relative">
        {jugador.foto ? (
          <Image 
            source={{ uri: jugador.foto }} 
            className="w-24 h-24" 
            style={{ marginTop: -10 }}
            resizeMode="contain" 
          />
        ) : (
          <Text className="text-gray-600 font-bold">{jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol}</Text>
        )}
        <View className="absolute -top-1 -left-1 bg-accent-cyan px-1.5 py-0.5 rounded-md">
          <Text className="text-midnight font-black text-[8px] uppercase">
            {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View className="flex-1">
        <Text className="text-white font-black text-xl tracking-tight">{jugador.nickname}</Text>
        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{jugador.equipoLec}</Text>
        
        {/* Trend Indicator for Rival Card */}
        <View className="flex-row items-center mt-1">
          {jugador.tendencia === 'SUBE' && <ChevronUp size={10} color="#10B981" />}
          {jugador.tendencia === 'BAJA' && <ChevronDown size={10} color="#F43F5E" />}
          <Text className={`text-[8px] font-black ml-1 ${
            jugador.tendencia === 'SUBE' ? 'text-emerald-400' : 
            jugador.tendencia === 'BAJA' ? 'text-rose-400' : 'text-gray-500'
          }`}>
            {jugador.tendencia === 'SUBE' ? 'SUBIENDO' : 
             jugador.tendencia === 'BAJA' ? 'BAJANDO' : 
             jugador.tendencia || 'ESTABLE'}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-white font-black text-sm italic">{(jugador.precioActual || jugador.precioBase).toLocaleString()} €</Text>
        <TouchableOpacity 
          className="bg-accent-magenta/20 px-3 py-1.5 rounded-xl mt-1 flex-row items-center"
          onPress={() => onClausulazo(jugador.id, jugador.nickname, jugador.precioBase, jugador.precioActual)}
        >
          <Zap size={12} color="#FF00FF" fill="#FF00FF" />
          <Text className="text-accent-magenta font-black text-[10px] ml-1 uppercase">Clausulazo</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
