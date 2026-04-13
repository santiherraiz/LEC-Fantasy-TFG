import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Users, LayoutGrid, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, setSelectedLiga } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleOtrasLigas = () => {
    setSelectedLiga(null);
    props.navigation.closeDrawer();
  };

  const handleLogout = () => {
    logout();
    props.navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nickname?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.nickname}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <ScrollView style={styles.menuItems}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => props.navigation.navigate('JugadoresList')}
        >
          <Users color="#9CA3AF" size={24} />
          <Text style={styles.menuItemText}>Jugadores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleOtrasLigas}
        >
          <LayoutGrid color="#9CA3AF" size={24} />
          <Text style={styles.menuItemText}>Otras Ligas</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={24} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  menuItems: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});
