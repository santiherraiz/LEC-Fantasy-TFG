import React from 'react';
import { View, Text } from 'react-native';
import { JugadorEstadistica } from '../types';

interface PlayerSeasonStatsProps {
  estadisticas: JugadorEstadistica[];
  statsSummary: {
    kda: string;
    csMin: string;
    vision: number;
  };
}

export const PlayerSeasonStats = React.memo(({ estadisticas, statsSummary }: PlayerSeasonStatsProps) => {
  const stats = [
    { label: 'Asesinatos', val: (estadisticas.reduce((acc, s) => acc + s.kills, 0) / (estadisticas.length || 1)).toFixed(1) },
    { label: 'Muertes', val: (estadisticas.reduce((acc, s) => acc + s.deaths, 0) / (estadisticas.length || 1)).toFixed(1) },
    { label: 'Asistencias', val: (estadisticas.reduce((acc, s) => acc + s.assists, 0) / (estadisticas.length || 1)).toFixed(1) },
    { label: 'KDA Ratio', val: statsSummary.kda },
    { label: 'CS por Minuto', val: statsSummary.csMin },
    { label: 'Victorias Totales', val: estadisticas.filter(s => s.resultado === 'WIN').length, isLast: true },
  ];

  return (
    <View className="p-4 mt-2 mb-8">
      <Text className="text-gray-400 text-xs font-black uppercase tracking-widest ml-1 mb-4">Promedios de Temporada</Text>
      <View className="bg-surface rounded-2xl overflow-hidden border border-surface-light/20">
        {stats.map((item, i) => (
          <View key={i} className={`flex-row justify-between p-5 ${!item.isLast ? 'border-b border-surface-light/10' : ''}`}>
            <Text className="text-gray-300 text-sm font-bold tracking-wide">{item.label}</Text>
            <Text className="text-accent-cyan text-sm font-black">{item.val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});
