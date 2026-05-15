import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { Zap, Trophy, Coins, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Player {
  idJugador: number;
  nickname: string;
  rol: string;
  imagenUrl: string | null;
  precio: number;
}

interface RosterRevealModalProps {
  visible: boolean;
  players: Player[];
  onClose: () => void;
  ligaNombre: string;
}

export default function RosterRevealModal({ visible, players, onClose, ligaNombre }: RosterRevealModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(-20);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.precio - b.precio);
  }, [players]);

  useEffect(() => {
    if (visible && sortedPlayers.length > 0) {
      setRevealedCount(0);
      setShowFullGrid(false);
      setShowButton(false);
      
      titleOpacity.value = withTiming(1, { duration: 1000 });
      titleY.value = withSpring(0);

      // Sequence: 1 by 1 centered - MUCH SLOWER now
      let current = 0;
      const revealNext = () => {
        if (current < sortedPlayers.length) {
          setRevealedCount(current + 1);
          current++;
          // 2.5 seconds per player for drama
          setTimeout(revealNext, 2500); 
        } else {
          // Transition to full grid
          setTimeout(() => {
            setShowFullGrid(true);
            setTimeout(() => setShowButton(true), 1200);
          }, 800);
        }
      };

      const initialDelay = setTimeout(revealNext, 1500);
      return () => clearTimeout(initialDelay);
    } else {
      titleOpacity.value = 0;
      titleY.value = -20;
    }
  }, [visible, sortedPlayers]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }]
  }));

  if (!visible) return null;

  return (
    <Modal transparent={false} visible={visible} animationType="fade">
      <View className="flex-1 bg-midnight justify-center items-center px-6">
        
        {/* Animated Background Glow */}
        <View className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
          <Animated.View 
            entering={FadeIn.duration(2000)}
            className="absolute -top-1/4 -left-1/4 w-full h-full bg-accent-cyan/20 rounded-full blur-[120px]" 
          />
          <Animated.View 
            entering={FadeIn.duration(2000).delay(500)}
            className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-accent-cyan/10 rounded-full blur-[140px]" 
          />
        </View>

        <Animated.View style={titleStyle} className="items-center mb-10">
          <Text className="text-accent-cyan text-xs font-black tracking-[4px] uppercase mb-2">¡Bienvenido a {ligaNombre}!</Text>
          <Text className="text-white text-3xl font-black italic uppercase text-center">Tu Equipo Inicial</Text>
          <View className="h-1 w-20 bg-accent-cyan mt-4 rounded-full" />
        </Animated.View>

        <View className="w-full items-center justify-center min-h-[350px]">
          {!showFullGrid ? (
            // Phase 1: Centered Focus
            <View className="items-center justify-center w-full">
              {sortedPlayers.map((player, index) => (
                index + 1 === revealedCount && (
                  <Animated.View 
                    key={`focus-${player.idJugador}`}
                    entering={FadeInDown.springify().damping(12).mass(1.2)}
                    exiting={FadeOut.duration(600)}
                    className="w-full items-center"
                  >
                    <PlayerCard 
                      player={player} 
                      isLast={index === sortedPlayers.length - 1} 
                      isFocused={true}
                    />
                  </Animated.View>
                )
              ))}
            </View>
          ) : (
            // Phase 2: Full Grid
            <Animated.View 
              entering={FadeIn.duration(600)}
              layout={Layout.springify()}
              className="flex-row flex-wrap justify-center gap-3 w-full"
            >
              {sortedPlayers.map((player, index) => (
                <PlayerCard 
                  key={`grid-${player.idJugador}`} 
                  player={player} 
                  isLast={index === sortedPlayers.length - 1} 
                  isFocused={false}
                />
              ))}
            </Animated.View>
          )}
        </View>

        {showButton && (
          <Animated.View entering={FadeInDown.springify().damping(15)} className="absolute bottom-16 left-8 right-8 w-full px-12">
            <TouchableOpacity 
              onPress={onClose}
              className="bg-accent-cyan py-5 rounded-[24px] items-center shadow-2xl shadow-accent-cyan/50"
            >
              <Text className="text-midnight font-black text-lg uppercase tracking-widest">EMPEZAR TEMPORADA</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

function PlayerCard({ player, isLast, isFocused }: { player: Player, isLast: boolean, isFocused: boolean }) {
  const rotateY = useSharedValue(180);
  const breathScale = useSharedValue(1);

  useEffect(() => {
    rotateY.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.exp) });
    
    if (isFocused) {
      breathScale.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotateY.value}deg` },
      { scale: isFocused ? breathScale.value : 1 }
    ]
  }));

  const cardWidth = isFocused ? width * 0.7 : (width - 64) / 2.3;

  return (
    <Animated.View 
      style={[animatedStyle, { width: cardWidth }]} 
      className={`rounded-[32px] p-4 items-center overflow-hidden border-2 ${
        isLast 
          ? 'bg-accent-cyan/10 border-accent-cyan shadow-2xl shadow-accent-cyan/30' 
          : 'bg-surface border-surface-light/30 shadow-xl'
      } ${isFocused ? 'py-8' : 'py-4'}`}
    >
      {isLast && (
        <View className="absolute top-0 left-0 right-0 py-1 bg-accent-cyan items-center flex-row justify-center">
          <Sparkles size={8} color="#0B0E14" className="mr-1" />
          <Text className="text-midnight text-[8px] font-black uppercase tracking-widest">ESTRELLA</Text>
        </View>
      )}

      {/* Role Badge */}
      <View className={`absolute ${isFocused ? 'top-6 right-6' : 'top-4 right-4'} bg-midnight/50 px-2 py-0.5 rounded-full border border-surface-light/20`}>
        <Text className="text-gray-400 font-black text-[7px] tracking-widest">{player.rol}</Text>
      </View>

      <View className={`${isFocused ? 'w-32 h-32' : 'w-16 h-16'} bg-midnight rounded-[28px] items-center justify-center mb-4 mt-2 border ${isLast ? 'border-accent-cyan/40' : 'border-surface-light/20'} overflow-hidden`}>
        {player.imagenUrl ? (
          <Image source={{ uri: player.imagenUrl }} className="w-full h-full mt-4" resizeMode="contain" />
        ) : (
          <Text className={`text-accent-cyan ${isFocused ? 'text-4xl' : 'text-xl'} font-black`}>{player.nickname.substring(0, 1)}</Text>
        )}
      </View>
      
      <Text className={`text-white font-black italic uppercase text-center ${isFocused ? 'text-xl mb-4' : 'text-xs mb-2'} leading-tight`} numberOfLines={1}>
        {player.nickname}
      </Text>
      
      <View className={`flex-row items-center px-3 py-1.5 rounded-2xl ${isLast ? 'bg-accent-cyan/20' : 'bg-midnight/40'}`}>
        <Coins size={isFocused ? 14 : 10} color={isLast ? "#00D1FF" : "#9CA3AF"} className="mr-2" />
        <Text className={`${isLast ? 'text-accent-cyan' : 'text-gray-400'} ${isFocused ? 'text-base' : 'text-[10px]'} font-black tracking-tighter`}>
          {player.precio ? player.precio.toLocaleString() : '0'} €
        </Text>
      </View>

      {isFocused && (
        <View className="mt-6 items-center">
          <Text className="text-accent-cyan/60 text-[10px] font-bold uppercase tracking-[2px]">Valor de Mercado</Text>
        </View>
      )}
    </Animated.View>
  );
}
