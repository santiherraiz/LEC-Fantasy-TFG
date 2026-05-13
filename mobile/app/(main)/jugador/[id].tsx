import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  TrendingUp,
  Activity,
  Shield,
  Zap,
} from 'lucide-react-native';

import { useJugadorDetalle } from '../../../src/hooks/useJugadorDetalle';
import { PlayerRadarChart } from '../../../src/components/PlayerRadarChart';
import { PlayerPointsEvolution } from '../../../src/components/PlayerPointsEvolution';
import { PlayerMatchCard } from '../../../src/components/PlayerMatchCard';
import { PlayerSeasonStats } from '../../../src/components/PlayerSeasonStats';

export default function JugadorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const {
    user,
    jugador,
    estadisticas,
    loading,
    activeTab,
    setActiveTab,
    selectedMapIndex,
    expandedSeries,
    groupedStats,
    weeklyData,
    statsSummary,
    allWeeksAsc,
    allWeeks,
    radarData,
    handleClausulazo,
    selectMap,
    toggleSerie,
    isProcessing
  } = useJugadorDetalle(id);

  if (loading) {
    return (
      <View className="flex-1 bg-midnight justify-center items-center">
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  if (!jugador) return null;

  const esPropietario = jugador.propietarioNickname === user?.nickname;

  return (
    <View className="flex-1 bg-midnight">
      {/* Header Fijo */}
      <View className="px-4 pt-14 pb-4 flex-row items-center border-b border-surface-light/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2.5 bg-surface rounded-xl border border-surface-light/50">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1 ml-4 flex-row items-center">
          <View>
            <Text className="text-white text-lg font-black italic uppercase">{jugador.nickname}</Text>
            <Text className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">
              {jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : jugador.rol} • {jugador.equipoLecNombre || 'AGENTE LIBRE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Navegación de Pestañas */}
      <View className="flex-row px-4 border-b border-surface-light/20">
        {(['RESUMEN', 'PARTIDOS', 'STATS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`py-4 mr-6 border-b-2 ${activeTab === tab ? 'border-accent-cyan' : 'border-transparent'}`}
          >
            <Text className={`text-xs font-black uppercase tracking-widest ${activeTab === tab ? 'text-accent-cyan' : 'text-gray-500'}`}>
              {tab === 'STATS' ? 'ESTADÍSTICAS' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* TAB: RESUMEN */}
        {activeTab === 'RESUMEN' && (
          <View className="p-4">
            {/* Tarjeta Principal */}
            <View className="py-8 bg-surface rounded-[32px] border border-surface-light/30 shadow-sm mt-2 overflow-hidden relative">
              {jugador.equipoLecLogo && (
                <Image
                  source={{ uri: jugador.equipoLecLogo }}
                  className="w-64 h-64 absolute -right-4 top-10 opacity-[0.18]"
                  style={{ transform: [{ rotate: '10deg' }] }}
                  resizeMode="contain"
                />
              )}
              <View className="flex-row px-6 items-center pt-4">
                <View className="w-32 h-32 bg-midnight/50 rounded-[32px] items-center justify-center border border-surface-light/40 overflow-hidden relative">
                  {jugador.imagenUrl ? (
                    <Image
                      source={{ uri: jugador.imagenUrl }}
                      className="w-32 h-32"
                      style={{ marginTop: 16 }}
                      resizeMode="contain"
                    />
                  ) : jugador.equipoLecLogo ? (
                    <Image source={{ uri: jugador.equipoLecLogo }} className="w-20 h-20 opacity-90" resizeMode="contain" />
                  ) : (
                    <Text className="text-accent-cyan text-3xl font-bold">{jugador.nickname?.substring(0, 1)}</Text>
                  )}
                </View>

                <View className="flex-1 ml-6 pt-2">
                  <Text className="text-white text-4xl font-black tracking-tighter uppercase italic leading-none">{jugador.nickname}</Text>
                  <Text className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">{jugador.nombreReal}</Text>

                  <View className="flex-row items-center mt-4">
                    <View className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <Text className="text-emerald-400 font-black text-sm">{(jugador.precioActual || jugador.precioBase)?.toLocaleString()} €</Text>
                    </View>
                    <View className="flex-row items-center ml-3 bg-surface/50 px-2 py-1 rounded-md">
                      {jugador.tendencia === 'SUBE' && <ChevronUp size={12} color="#10B981" />}
                      {jugador.tendencia === 'BAJA' && <ChevronDown size={12} color="#F43F5E" />}
                      <Text className={`text-[9px] font-black ml-1 ${jugador.tendencia === 'SUBE' ? 'text-emerald-400' :
                        jugador.tendencia === 'BAJA' ? 'text-rose-400' : 'text-gray-500'
                        }`}>
                        {jugador.tendencia === 'SUBE' ? 'SUBIENDO' :
                          jugador.tendencia === 'BAJA' ? 'BAJANDO' :
                            jugador.tendencia || 'ESTABLE'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dueño y Acciones */}
              <View className="mt-5 mx-6 pt-5 border-t border-surface-light/10">
                <View className="bg-midnight/40 rounded-[28px] p-5 border border-surface-light/10 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border ${jugador.propietarioNickname ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                      {jugador.propietarioNickname ? (
                        <Shield color="#00D1FF" size={22} />
                      ) : (
                        <Zap color="#00FF94" size={22} fill="#00FF94" opacity={0.2} />
                      )}
                    </View>
                    <View>
                      <Text className="text-gray-500 text-[9px] font-black uppercase tracking-[1.5px] mb-1">
                        {jugador.propietarioNickname ? 'CONTRATADO POR' : 'ESTADO ACTUAL'}
                      </Text>
                      {jugador.propietarioNickname ? (
                        <TouchableOpacity
                          onPress={() => router.push(`/(main)/rival/${jugador.propietarioEquipoId}`)}
                          className="flex-row items-center"
                        >
                          <Text className="text-white font-black text-lg italic uppercase tracking-tight">
                            {esPropietario ? "Tu Equipo" : jugador.propietarioNickname}
                          </Text>
                          {!esPropietario && <ChevronRight color="#00D1FF" size={18} className="ml-1" />}
                        </TouchableOpacity>
                      ) : (
                        <Text className="text-neon-green font-black text-lg italic uppercase tracking-tight">AGENTE LIBRE</Text>
                      )}
                    </View>
                  </View>

                  {!esPropietario && jugador.propietarioNickname && (
                    <TouchableOpacity
                      onPress={handleClausulazo}
                      disabled={isProcessing}
                      className="bg-rose-600 px-5 py-3 rounded-2xl flex-row items-center shadow-lg shadow-rose-900/40 active:scale-95"
                    >
                      <Zap size={14} color="white" strokeWidth={3} fill="white" />
                      <Text className="text-white font-black ml-2 text-[10px] uppercase">ROBAR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Evolución Gráfica */}
            <View className="mt-8">
              <View className="flex-row items-center ml-1 mb-4">
                <TrendingUp size={18} color="#00D1FF" />
                <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-2">Evolución Puntos</Text>
              </View>
              <PlayerPointsEvolution
                weeklyData={weeklyData}
                allWeeksAsc={allWeeksAsc}
                avgPoints={statsSummary.avgPoints}
              />
            </View>

            {/* Radar Técnico */}
            <View className="mt-8 mb-4">
              <View className="flex-row items-center ml-1 mb-4">
                <Activity size={18} color="#00D1FF" />
                <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-2">Comparativa Técnica</Text>
              </View>
              <PlayerRadarChart radarData={radarData} playerNickname={jugador.nickname} />
            </View>
          </View>
        )}

        {/* TAB: PARTIDOS */}
        {activeTab === 'PARTIDOS' && (
          <View className="p-4 mt-2">
            {allWeeks.length === 0 && (
              <Text className="text-gray-500 italic text-center mt-10">Aún no hay partidos registrados.</Text>
            )}

            {allWeeks.map(week => {
              const weekStats = groupedStats[week];
              if (!weekStats) {
                return (
                  <View key={week} className="mb-8">
                    <Text className="text-white text-lg font-black mb-3 uppercase italic tracking-wider">SEMANA {week}</Text>
                    <View className="bg-surface p-6 rounded-2xl border border-dashed border-surface-light/30 items-center">
                      <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{jugador.equipoLecNombre || 'EL EQUIPO'} NO JUGÓ</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={week} className="mb-8">
                  <Text className="text-white text-lg font-black mb-3 uppercase italic tracking-wider">SEMANA {week}</Text>
                  {Object.keys(weekStats).sort((a, b) => {
                    const dateA = new Date(weekStats[a]?.[0]?.fecha || 0).getTime();
                    const dateB = new Date(weekStats[b]?.[0]?.fecha || 0).getTime();
                    return dateB - dateA;
                  }).map(serieId => (
                    <PlayerMatchCard
                      key={serieId}
                      serieId={serieId}
                      maps={weekStats[serieId]}
                      isExpanded={expandedSeries[serieId]}
                      onToggle={toggleSerie}
                      currentMapIdx={selectedMapIndex[serieId] || 0}
                      onSelectMap={selectMap}
                      playerNickname={jugador.nickname}
                      playerEquipoLecNombre={jugador.equipoLecNombre || 'AGENTE LIBRE'}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* TAB: STATS */}
        {activeTab === 'STATS' && (
          <PlayerSeasonStats estadisticas={estadisticas} statsSummary={statsSummary} />
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}