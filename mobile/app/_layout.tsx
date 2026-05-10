import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/context/ToastContext';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export default function RootLayout() {
  const { isAuthenticated, selectedLigaId } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function setupAndroid() {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('sticky-immersive' as any);
        } catch (e) {
          console.log("Error configurando NavigationBar:", e);
        }
      }
    }
    setupAndroid();
  }, []);

  const [hasHydrated, setHasHydrated] = React.useState(false);

  useEffect(() => {
    const unsubHydrate = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    setHasHydrated(useAuthStore.persist.hasHydrated());

    return () => unsubHydrate();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return; // Esperar a que los datos se lean del disco

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (!selectedLigaId) {
        router.replace('/league-selection');
      } else {
        router.replace('/equipo');
      }
    } else if (isAuthenticated && !selectedLigaId && segments[0] !== 'league-selection') {
       router.replace('/league-selection');
    } else if (isAuthenticated && selectedLigaId && (segments[0] === 'league-selection' || inAuthGroup)) {
       router.replace('/equipo');
    }
  }, [isAuthenticated, selectedLigaId, segments, hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
            <Stack.Screen name="league-selection" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
