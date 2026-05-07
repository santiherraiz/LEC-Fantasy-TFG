import { Tabs } from 'expo-router';
import { ShoppingBag, Trophy, Layout, Gavel } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0E14',
          borderTopColor: '#2D3748',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 0,
        },
        tabBarActiveTintColor: '#00D1FF',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Tabs.Screen
        name="equipo"
        options={{
          tabBarLabel: 'Equipo',
          tabBarIcon: ({ color, size }) => <Layout color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="subastas"
        options={{
          tabBarLabel: 'Subastas',
          tabBarIcon: ({ color, size }) => <Gavel color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          tabBarLabel: 'Catálogo',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
