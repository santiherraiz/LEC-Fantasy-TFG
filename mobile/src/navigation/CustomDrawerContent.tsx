import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Users, LayoutGrid, LogOut, Shield, Trophy, ShoppingBag, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, setSelectedLiga, selectedLigaNombre } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleOtrasLigas = () => {
    setSelectedLiga(null);
    props.navigation.closeDrawer();
  };

  const handleLogout = () => {
    logout();
    props.navigation.closeDrawer();
  };

  const isActive = (routeName: string) => {
    const state = props.state;
    const currentRoute = state.routes[state.index];
    
    // Si estamos en el navigator de Tabs, buscamos la ruta activa dentro de él
    if (currentRoute.name === 'Tabs' && currentRoute.state) {
      const tabState = currentRoute.state;
      const activeTabName = tabState.routes[tabState.index || 0].name;
      return activeTabName === routeName;
    }
    
    return currentRoute.name === routeName;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={{ width: '100%', height: 50, marginBottom: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Image 
            source={require('../../assets/logos/LOGOTIPO-bg.png')} 
            style={{ width: 220, height: 100 }}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfoContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.nickname?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{user?.nickname}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        
        {selectedLigaNombre && (
          <View style={styles.ligaBadge}>
            <Trophy color="#00D1FF" size={14} />
            <Text style={styles.ligaBadgeText}>{selectedLigaNombre}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Competición</Text>
        
        <DrawerItem 
          label="Mi Equipo" 
          icon={<Shield size={22} />} 
          active={isActive('MiEquipo')} 
          onPress={() => props.navigation.navigate('Tabs', { screen: 'MiEquipo' })} 
        />
        
        <DrawerItem 
          label="Mercado" 
          icon={<ShoppingBag size={22} />} 
          active={isActive('Mercado')} 
          onPress={() => props.navigation.navigate('Tabs', { screen: 'Mercado' })} 
        />

        <DrawerItem 
          label="Jugadores" 
          icon={<Users size={22} />} 
          active={isActive('JugadoresList')} 
          onPress={() => props.navigation.navigate('JugadoresList')} 
        />

        <DrawerItem 
          label="Ranking" 
          icon={<Trophy size={22} />} 
          active={isActive('Ranking')} 
          onPress={() => props.navigation.navigate('Tabs', { screen: 'Ranking' })} 
        />

        <Text style={styles.sectionTitle}>Ajustes</Text>

        <DrawerItem 
          label="Cambiar de Liga" 
          icon={<LayoutGrid size={22} />} 
          active={false} 
          onPress={handleOtrasLigas} 
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>v1.0.0 Alpha</Text>
      </View>
    </View>
  );
}

function DrawerItem({ label, icon, active, onPress }: { label: string, icon: any, active: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, active && styles.menuItemActive]} 
      onPress={onPress}
    >
      {React.cloneElement(icon, { color: active ? '#00D1FF' : '#9CA3AF' })}
      <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.3)',
  },
  avatarText: {
    color: '#00D1FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#6B7280',
    fontSize: 12,
  },
  ligaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 209, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.2)',
  },
  ligaBadgeText: {
    color: '#00D1FF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  menuItems: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(0, 209, 255, 0.08)',
  },
  menuItemText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
  },
  menuItemTextActive: {
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  versionText: {
    color: '#374151',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },
});
