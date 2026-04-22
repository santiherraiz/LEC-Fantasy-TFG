import 'react-native-gesture-handler';
import "./global.css";
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/context/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const CustomTheme = {
  dark: true,
  colors: {
    ...(DarkTheme?.colors || {}),
    primary: '#3B82F6',
    background: '#111827',
    card: '#111827',
    text: 'white',
    border: '#1F2937',
    notification: '#3B82F6',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  }
};

export default function App() {
  React.useEffect(() => {
    async function setupAndroid() {
      if (Platform.OS === 'android') {
        try {
          // OCULTAR BARRA DE NAVEGACIÓN (BOTONES)
          await NavigationBar.setVisibilityAsync('hidden');

          // COMPORTAMIENTO STICKY: Se oculta sola tras deslizar (Como juegos)
          // Se usa 'as any' porque aunque funciona visualmente en Android, no está tipado en la versión actual de la librería
          await NavigationBar.setBehaviorAsync('sticky-immersive' as any);

          // OPCIONAL: También podemos ocultar la barra de estado de arriba 
          // para que sea 100% pantalla completa
          // await NavigationBar.setStatusBarVisibilityAsync('hidden');

        } catch (e) {
          console.log("Error configurando NavigationBar:", e);
        }
      }
    }
    setupAndroid();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer theme={CustomTheme}>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
