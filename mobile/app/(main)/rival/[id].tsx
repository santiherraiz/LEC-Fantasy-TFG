import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Users,
  Shield,
  TrendingUp,
  Map as MapIcon,
  Wallet,
  Eye
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn
} from 'react-native-reanimated';

import { useRivalDetalle } from '../../../src/hooks/useRivalDetalle';
import { RivalPlayerCard } from '../../../src/components/RivalPlayerCard';
import { RivalTacticalMap } from '../../../src/components/RivalTacticalMap';
import CustomHeader from '../../../src/components/CustomHeader';

const { width } = Dimensions.get('window');
const MAP_SIZE = width;

const ROLES_ORDEN = [
  { key: 'TOP', label: 'TOP' },
  { key: 'JUNGLE', label: 'JUNGLE' },
  { key: 'MID', label: 'MID' },
  { key: 'BOT', label: 'BOT' },
  { key: 'SUPPORT', label: 'SUPP' }
];

export default function RivalTeamScreen() {
  const router = useRouter();
  const {
    equipo,
    loading,
    refreshing,
    onRefresh,
    handleClausulazo,
    isOwnTeam,
    titulares,
    banquillo,
    valorPlantilla,
  } = useRivalDetalle();

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!equipo) return null;

  return (
    <View className="flex-1 bg-midnight">
      <CustomHeader title={isOwnTeam ? "Mi Perfil" : "Equipo Rival"} showBackButton />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />}
      >
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="px-6 pt-8 pb-6"
        >
          <View className="flex-row items-center mb-6">
            <View className="w-20 h-20 bg-surface rounded-[32px] items-center justify-center border-2 border-accent-cyan/20 shadow-xl shadow-accent-cyan/10">
              <User color="#00D1FF" size={40} />
            </View>
            <View className="ml-6 flex-1">
              <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px] mb-1">
                {isOwnTeam ? "Tu perfil de Manager" : "Manager de la Liga"}
              </Text>
              <Text className="text-white font-black text-4xl italic uppercase tracking-tighter leading-none" numberOfLines={1}>
                {equipo.nombreUsuario}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-surface/80 p-5 rounded-[32px] border border-surface-light/20 items-center">
              <View className="flex-row items-center mb-2">
                <TrendingUp color="#00D1FF" size={14} />
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-2">Puntos Totales</Text>
              </View>
              <View className="flex-row items-center justify-center w-full relative h-10">
                <View className="flex-row items-end">
                  <Text className="text-white text-3xl font-black italic">{Math.round(equipo.puntosTotales)}</Text>
                  <Text className="text-accent-cyan font-black mb-1 ml-1.5 text-[10px]">PTS</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/(main)/equipo-jornada/${equipo.id}`)}
                  className="w-10 h-10 bg-accent-cyan/10 rounded-2xl items-center justify-center border border-accent-cyan/20 absolute right-0"
                >
                  <Eye color="#00D1FF" size={18} />
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-1 bg-surface/80 p-5 rounded-[32px] border border-surface-light/20 items-center justify-center">
              <View className="flex-row items-center mb-2">
                <Wallet color="#39FF14" size={14} />
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-2">Valor Plantilla</Text>
              </View>
              <Text className="text-white text-xl font-black tracking-tight">{valorPlantilla.toLocaleString()} €</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} className="mb-10 px-4">
          <View className="flex-row items-center justify-between mb-6 px-2">
            <View className="flex-row items-center">
              <MapIcon color="white" size={20} />
              <Text className="text-white text-xl font-black ml-3 italic uppercase tracking-tighter">Esquema Táctico</Text>
            </View>
            <View className="bg-accent-cyan/10 px-4 py-1.5 rounded-full border border-accent-cyan/30 shadow-sm">
              <Text className="text-accent-cyan text-[10px] font-black uppercase tracking-widest">{titulares.length}/5 TITULARES</Text>
            </View>
          </View>

          <View className="relative items-center">
            <RivalTacticalMap jugadores={titulares} mapSize={MAP_SIZE} />
          </View>
        </Animated.View>

        <View className="bg-surface/50 rounded-t-[48px] px-6 pt-10 pb-32 border-t border-surface-light/20">
          <View className="flex-row items-center mb-8">
            <Shield color="#00D1FF" size={24} />
            <Text className="text-white text-2xl font-black ml-4 tracking-tight">ROSTER INICIAL</Text>
          </View>

          <View className="space-y-6">
            {ROLES_ORDEN.map((rol, idx) => {
              const jugador = titulares.find(j => j.rol.toUpperCase() === rol.key);
              return (
                <Animated.View key={rol.key} entering={FadeInRight.delay(idx * 100)}>
                  <View className="flex-row items-center mb-6">
                    <View className="w-12 items-center justify-center mr-3">
                      <Text className="text-accent-cyan font-black text-[10px] uppercase italic -rotate-90" style={{ width: 60, textAlign: 'center' }}>
                        {rol.label}
                      </Text>
                    </View>
                    <View className="flex-1">
                      {jugador ? (
                        <RivalPlayerCard jugador={jugador} onClausulazo={handleClausulazo} noMargin isOwnTeam={isOwnTeam} />
                      ) : (
                        <View className="flex-1 bg-midnight/30 p-5 rounded-[28px] border border-dashed border-surface-light/20 items-center justify-center">
                          <Text className="text-gray-600 font-black text-[10px] uppercase tracking-widest italic">Posición Vacía</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <View className="flex-row items-center mt-12 mb-8">
            <Users color="#9CA3AF" size={24} />
            <Text className="text-white text-2xl font-black ml-4 tracking-tight">BANQUILLO</Text>
          </View>

          {banquillo.length > 0 ? (
            banquillo.map((j, idx) => (
              <Animated.View key={j.id} entering={FadeInRight.delay((idx + 5) * 100)}>
                <RivalPlayerCard jugador={j} onClausulazo={handleClausulazo} isOwnTeam={isOwnTeam} />
              </Animated.View>
            ))
          ) : (
            <View className="bg-midnight/30 p-10 rounded-[32px] border border-dashed border-surface-light/20 items-center">
              <Text className="text-gray-500 italic font-medium">No hay reservas en este equipo</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
