import React from 'react';
import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { ShoppingBag, Trophy, Layout, Gavel, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0E14',
          borderTopWidth: 0,
          height: 80 + insets.bottom, // Subimos de 70 a 80
          paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20, // Añadimos más margen
          paddingTop: 12,
          elevation: 0,
        },
        tabBarActiveTintColor: '#00D1FF',
        tabBarInactiveTintColor: '#4B5563',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="equipo"
        options={{
          tabBarLabel: 'Equipo',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-2xl ${focused ? 'bg-accent-cyan/10' : ''}`}>
              <Layout color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="subastas"
        options={{
          tabBarLabel: 'Subastas',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-2xl ${focused ? 'bg-accent-cyan/10' : ''}`}>
              <Gavel color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          tabBarLabel: 'Mercado',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-2xl ${focused ? 'bg-accent-cyan/10' : ''}`}>
              <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-2xl ${focused ? 'bg-accent-cyan/10' : ''}`}>
              <Trophy color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Muro',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-2xl ${focused ? 'bg-accent-cyan/10' : ''}`}>
              <MessageSquare color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
