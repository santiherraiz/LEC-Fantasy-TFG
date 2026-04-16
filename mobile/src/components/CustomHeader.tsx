import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.content}>
        <TouchableOpacity 
          onPress={handlePress}
          style={styles.iconBtn}
        >
          {showBackButton ? (
            <ChevronLeft color="white" size={28} />
          ) : (
            <Menu color="white" size={28} />
          )}
        </TouchableOpacity>
        
        <View style={styles.centerContainer}>
          <Text style={styles.gameTitle}>LEC FANTASY</Text>
          {displayNombre && (
            <Text style={styles.leagueName}>{displayNombre}</Text>
          )}
        </View>

        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconBtn: {
    padding: 4,
  },
  centerContainer: {
    alignItems: 'center',
  },
  gameTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  leagueName: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: -2,
  },
  rightPlaceholder: {
    width: 36, // To match the Menu icon button size for centering
  }
});
