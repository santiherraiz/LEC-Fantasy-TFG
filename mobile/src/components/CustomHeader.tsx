import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

interface CustomHeaderProps {
  ligaNombre?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function CustomHeader({ ligaNombre, showBackButton, onBackPress }: CustomHeaderProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedLigaNombre } = useAuthStore();

  const handlePress = () => {
    if (showBackButton) {
      if (onBackPress) {
        onBackPress();
      } else {
        router.back();
      }
    } else {
      // Safely toggle drawer
      try {
        navigation.dispatch(DrawerActions.toggleDrawer());
      } catch (e) {
        console.warn("Navigation drawer context not found", e);
      }
    }
  };

  return (
    <View 
      className="bg-midnight border-b border-surface-light/30"
      style={{ paddingTop: insets.top, height: insets.top + 60 }}
    >
      <View className="flex-1 flex-row items-center justify-between px-4">
        <View className="w-12">
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
        </View>
        
        <View className="flex-1 items-center justify-center h-full">
          <View style={{ width: 180, height: 45, alignItems: 'center', justifyContent: 'center' }}>
            <Image 
              source={require('../../assets/logos/LOGOTIPO-bg.png')} 
              style={{ width: 280, height: 100 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="w-12" />
      </View>
    </View>
  );
}
