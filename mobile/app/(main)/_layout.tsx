import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../src/navigation/CustomDrawerContent';
import { useNotifications } from '../../src/hooks/useNotifications';

export default function MainLayout() {
  useNotifications();
  
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#0B0E14',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="(tabs)" 
        options={{ 
          drawerLabel: 'Competición',
        }} 
      />
      <Drawer.Screen 
        name="jugadores" 
        options={{ 
          drawerLabel: 'Lista de Jugadores',
        }} 
      />
      {/* Detail screens should be here if we want them reachable but hidden from drawer */}
      <Drawer.Screen 
        name="jugador/[id]" 
        options={{ 
          drawerItemStyle: { display: 'none' }
        }} 
      />
    </Drawer>
  );
}
