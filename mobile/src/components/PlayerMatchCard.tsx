import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronRight, Swords, Skull, Users, Wheat } from 'lucide-react-native';
import { JugadorEstadistica } from '../types';

interface PlayerMatchCardProps {
  serieId: string;
  maps: JugadorEstadistica[];
  isExpanded: boolean;
  onToggle: (id: string) => void;
  currentMapIdx: number;
  onSelectMap: (id: string, idx: number) => void;
  playerNickname: string;
  playerEquipoLecNombre: string;
}

export const PlayerMatchCard = React.memo(({
  serieId,
  maps,
  isExpanded,
  onToggle,
  currentMapIdx,
  onSelectMap,
  playerNickname,
  playerEquipoLecNombre
}: PlayerMatchCardProps) => {
  const map = maps[currentMapIdx];
  if (!map) return null;

  const totalSeriePoints = Math.round(maps.reduce((acc, m) => acc + (m.puntosGenerados || 0), 0));
  const wins = maps.filter(m => m.resultado === 'WIN').length;
  const losses = maps.length - wins;
  const isAce = maps.length === 2 && wins === 2;
  const globalResult = wins > losses ? 'WIN' : 'LOSS';
  const displayResult = isExpanded ? (map.resultado || 'LOSS') : globalResult;

  const equipoEnEsePartido = map.jugadorEquipo || playerEquipoLecNombre || 'AGENTE LIBRE';
  const isTeam1 = map.team1?.toLowerCase() === equipoEnEsePartido?.toLowerCase();
  const rival = isTeam1 ? (map.team2 || 'Rival') : (map.team1 || 'Rival');
  const rivalLogo = isTeam1 ? map.team2Logo : map.team1Logo;

  return (
    <View className="bg-surface rounded-2xl p-5 mb-4 border border-surface-light/20 shadow-sm">
      <TouchableOpacity onPress={() => onToggle(serieId)} className="flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mr-2">vs</Text>
            <View className="w-8 h-8 bg-surface-light/10 rounded-lg items-center justify-center mr-1 border border-surface-light/10">
              {rivalLogo ? (
                <Image
                  source={{ uri: rivalLogo }}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              ) : (
                <Text className="text-[8px] text-gray-500 font-black">{rival.substring(0, 2)}</Text>
              )}
            </View>
            <Text className="text-white text-xl font-black flex-shrink" numberOfLines={1}>{rival}</Text>
            {isAce && (
              <View className="bg-accent-cyan/20 px-2 py-0.5 rounded-lg ml-2 border border-accent-cyan/30">
                <Text className="text-accent-cyan text-[9px] font-black tracking-widest uppercase">ACE</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <Text className="text-accent-cyan text-base font-black">{totalSeriePoints}</Text>
            <Text className="text-gray-500 text-[9px] font-bold ml-2 uppercase tracking-widest">Pts Fantasy</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className={`px-3 py-1.5 rounded-lg mr-4 ${displayResult === 'WIN' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
            <Text className={`text-[10px] font-black tracking-widest ${displayResult === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {displayResult === 'WIN' ? 'VICTORIA' : 'DERROTA'}
            </Text>
          </View>
          {isExpanded ? <ChevronDown color="#9CA3AF" size={20} /> : <ChevronRight color="#9CA3AF" size={20} />}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-5 pt-5 border-t border-surface-light/10">
          <View className="flex-row mb-5 bg-midnight rounded-xl p-1.5 border border-surface-light/20">
            {maps.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => onSelectMap(serieId, idx)}
                className={`flex-1 py-2.5 items-center rounded-lg ${currentMapIdx === idx ? 'bg-accent-cyan/10 border border-accent-cyan/30' : ''}`}
              >
                <Text className={`text-xs font-black tracking-widest ${currentMapIdx === idx ? 'text-accent-cyan' : 'text-gray-500'}`}>MAPA {idx + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-midnight rounded-2xl p-5 border border-surface-light/20">
            <View className="flex-row flex-wrap justify-between">
              {[
                { icon: <Swords size={18} color="#00D1FF" />, label: 'KILLS', val: map.kills, pts: map.kills * 3 },
                { icon: <Skull size={18} color="#FB7185" />, label: 'DEATHS', val: map.deaths, pts: map.deaths * -1 },
                { icon: <Users size={18} color="#00D1FF" />, label: 'ASSISTS', val: map.assists, pts: Math.round(map.assists * 1.5 * 10) / 10 },
                { icon: <Wheat size={18} color="#FBBF24" />, label: 'FARM', val: map.cs, pts: Math.round(map.cs * 0.02 * 100) / 100 },
              ].map((s, i) => (
                <View key={i} className="w-[48%] bg-surface rounded-xl p-4 items-center mb-3 border border-surface-light/10">
                  <View className="w-10 h-10 rounded-xl bg-midnight items-center justify-center mb-2 border border-surface-light/20">
                    {s.icon}
                  </View>
                  <Text className="text-gray-500 text-[10px] font-black mb-1.5 tracking-widest">{s.label}</Text>
                  <Text className="text-white text-xl font-bold mb-2">{s.val}</Text>
                  <View className={`px-2.5 py-1 rounded-md ${s.pts === 0 ? 'bg-gray-800' : s.pts > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    <Text className={`text-[10px] font-black ${s.pts === 0 ? 'text-gray-400' : s.pts > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.pts > 0 ? `+${s.pts}` : s.pts}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {map.resultado === 'WIN' && (
              <View className="flex-row justify-between items-center bg-emerald-500/10 p-3.5 rounded-xl mb-4 mt-2 border border-dashed border-emerald-500/30">
                <Text className="text-emerald-400 text-xs font-black tracking-widest">BONUS VICTORIA</Text>
                <Text className="text-emerald-400 text-sm font-bold">+5 PTS</Text>
              </View>
            )}

            <View className="bg-midnight/60 p-6 rounded-[32px] border border-surface-light/20 mt-4">
              <View className="items-center mb-6">
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Rendimiento Mapa {currentMapIdx + 1}</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-6xl font-black tracking-tighter">{Math.round(map.puntosReales || 0)}</Text>
                  <Text className="text-gray-400 text-lg font-black ml-2 uppercase">Pts</Text>
                </View>
              </View>

              <View className="h-[1px] bg-white/5 mb-6" />

              <View>
                <Text className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-4">Cálculo de la Serie</Text>
                <View className="mb-4">
                  {maps.map((m, i) => (
                    <View key={i} className="flex-row justify-between items-center opacity-60 mb-1">
                      <Text className="text-gray-400 text-xs font-bold">Puntos Mapa {i + 1}</Text>
                      <Text className="text-white text-xs font-black">{Math.round(m.puntosReales || 0)}</Text>
                    </View>
                  ))}
                </View>

                <View className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/5">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-400 text-[10px] font-medium italic">Promedio ({maps.map(m => Math.round(m.puntosReales)).join(' + ')}) / {maps.length}</Text>
                    <Text className="text-white text-sm font-black">{Math.round(maps.reduce((acc, m) => acc + (m.puntosReales || 0), 0) / maps.length)}</Text>
                  </View>
                  {isAce && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-accent-cyan text-[10px] font-black uppercase tracking-tighter italic">Bono ACE (Victoria 2-0)</Text>
                      <Text className="text-accent-cyan text-sm font-black">+5</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-accent-cyan text-[10px] font-black uppercase italic tracking-wider">Total para Ranking</Text>
                    <Text className="text-gray-600 text-[8px] font-bold uppercase">Suma final de la serie</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-accent-cyan text-3xl font-black leading-none">{totalSeriePoints}</Text>
                    <Text className="text-accent-cyan/60 text-[8px] font-black uppercase tracking-tighter mt-1">Pts Fantasy</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});
