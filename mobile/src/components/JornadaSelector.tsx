import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Jornada } from '../types';

interface JornadaSelectorProps {
  selectedJornada: Jornada | null;
  currentIndex: number;
  totalJornadas: number;
  onPrev: () => void;
  onNext: () => void;
}

export const JornadaSelector = React.memo(({ 
  selectedJornada, 
  currentIndex, 
  totalJornadas, 
  onPrev, 
  onNext 
}: JornadaSelectorProps) => {
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === -1 || currentIndex === totalJornadas - 1;

  return (
    <View className="bg-surface/50 border-b border-surface-light/20 py-4 px-6 flex-row items-center justify-between">
      <TouchableOpacity
        disabled={isLast}
        onPress={onPrev}
        className={`p-2 bg-midnight rounded-full border ${isLast ? 'border-surface-light/5 opacity-30' : 'border-surface-light/20'}`}
      >
        <ChevronLeft color={isLast ? "#475569" : "#00D1FF"} size={20} />
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Semana</Text>
        <Text className="text-white font-black text-xl italic uppercase">
          {selectedJornada ? selectedJornada.numeroSemana : '...'}
        </Text>
        {selectedJornada && (
          <View className={`px-2 py-0.5 rounded-full mt-1 ${
            selectedJornada.estado === 'FINALIZADA' ? 'bg-neon-green/10 border border-neon-green/30' :
            selectedJornada.estado === 'BLOQUEADA' ? 'bg-accent-cyan/10 border border-accent-cyan/30' : 
            'bg-gray-500/10 border border-gray-500/30'
          }`}>
            <Text className={`text-[8px] font-black uppercase tracking-widest ${
              selectedJornada.estado === 'FINALIZADA' ? 'text-neon-green' :
              selectedJornada.estado === 'BLOQUEADA' ? 'text-accent-cyan' : 
              'text-gray-500'
            }`}>{selectedJornada.estado}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        disabled={isFirst}
        onPress={onNext}
        className={`p-2 bg-midnight rounded-full border ${isFirst ? 'border-surface-light/5 opacity-30' : 'border-surface-light/20'}`}
      >
        <ChevronRight color={isFirst ? "#475569" : "#00D1FF"} size={20} />
      </TouchableOpacity>
    </View>
  );
});
