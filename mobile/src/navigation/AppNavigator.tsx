import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ShoppingBag, Trophy, Layout } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MiEquipoScreen from '../screens/main/MiEquipoScreen';
import MercadoScreen from '../screens/main/MercadoScreen';
import RankingScreen from '../screens/main/RankingScreen';
import JugadorDetailScreen from '../screens/main/JugadorDetailScreen';
import LeagueSelectionScreen from '../screens/main/LeagueSelectionScreen';
import JugadoresListScreen from '../screens/main/JugadoresListScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1f2937',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 0,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
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

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#111827',
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
      <Drawer.Screen name="JugadoresList" component={JugadoresListScreen} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, selectedLigaId } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !selectedLigaId ? (
        <Stack.Screen name="LeagueSelection" component={LeagueSelectionScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainDrawer} />
          <Stack.Screen name="JugadorDetail" component={JugadorDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
