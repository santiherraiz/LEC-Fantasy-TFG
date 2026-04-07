import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Users, ShoppingBag, Trophy, Layout } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MiEquipoScreen from '../screens/main/MiEquipoScreen';
import MercadoScreen from '../screens/main/MercadoScreen';
import RankingScreen from '../screens/main/RankingScreen';
import JugadorDetailScreen from '../screens/main/JugadorDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1f2937',
          paddingBottom: 25, // Aumentado para mayor separación
          height: 80, // Aumentado para acomodar el padding
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen 
        name="MiEquipo" 
        component={MiEquipoScreen} 
        options={{
          tabBarLabel: 'Mi Equipo',
          tabBarIcon: ({ color, size }) => <Layout color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Mercado" 
        component={MercadoScreen} 
        options={{
          tabBarLabel: 'Mercado',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="JugadorDetail" component={JugadorDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
