import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Menu, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

interface CustomHeaderProps {
  ligaNombre?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function CustomHeader({ ligaNombre, showBackButton, onBackPress }: CustomHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedLigaNombre } = useAuthStore();

  const displayNombre = ligaNombre || selectedLigaNombre;

  const handlePress = () => {
    if (showBackButton && onBackPress) {
      onBackPress();
    } else if (showBackButton) {
      navigation.goBack();
    } else {
      navigation.dispatch(DrawerActions.toggleDrawer());
    }
  };

  return (
    <View 
      className="bg-midnight border-b border-surface-light/30 pb-3"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="flex-row items-center justify-between px-4">
        <TouchableOpacity 
          onPress={handlePress}
          className="p-1"
        >
          {showBackButton ? (
            <ChevronLeft color="white" size={28} />
          ) : (
            <Menu color="white" size={28} />
          )}
        </TouchableOpacity>
        
        <View className="items-center">
          <Image 
            source={require('../../assets/logos/LOGOTIPO-bg.png')} 
            className="w-32 h-8"
            resizeMode="contain"
          />
          {displayNombre && (
            <Text className="text-accent-cyan text-[10px] font-bold uppercase tracking-widest -mt-1">{displayNombre}</Text>
          )}
        </View>

        <View className="w-9" />
      </View>
    </View>
  );
}
