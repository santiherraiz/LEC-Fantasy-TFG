import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/api';
import { Trophy, Plus, Link, ChevronRight, LogOut } from 'lucide-react-native';

export default function LeagueSelectionScreen() {
  const { user, setSelectedLiga, logout } = useAuthStore();
  const [ligas, setLigas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nombreLiga, setNombreLiga] = useState('');

  const fetchLigas = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/usuarios/${user.id}/mis-ligas`);
      setLigas(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLigas();
  }, []);

  const handleCreate = async () => {
    if (!nombreLiga) return;
    try {
      await api.post('/ligas/crear', { nombre: nombreLiga, adminId: user?.id });
      Alert.alert('Éxito', 'Liga creada correctamente');
      setNombreLiga('');
      setShowCreate(false);
      fetchLigas();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la liga');
    }
  };

  const handleJoin = async () => {
    if (!codigo) return;
    try {
      await api.post('/ligas/unirse', { codigoAcceso: codigo, usuarioId: user?.id });
      Alert.alert('Éxito', 'Te has unido a la liga');
      setCodigo('');
      setShowJoin(false);
      fetchLigas();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Código inválido o ya estás en la liga');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mis Ligas</Text>
          <Text style={styles.subtitle}>Selecciona una liga para jugar.</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut color="#EF4444" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchLigas();}} tintColor="#3b82f6" />}
      >
        <View style={styles.ligasList}>
          {ligas.map((liga) => (
            <TouchableOpacity 
              key={liga.id} 
              style={styles.ligaCard}
              onPress={() => setSelectedLiga(liga.id)}
            >
              <View style={styles.ligaIcon}>
                <Trophy color="#3B82F6" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ligaName}>{liga.nombre}</Text>
                <Text style={styles.ligaCode}>CÓDIGO: {liga.codigoAcceso}</Text>
              </View>
              <ChevronRight color="#4B5563" />
            </TouchableOpacity>
          ))}

          {ligas.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aún no estás en ninguna liga.</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#1F2937' }]}
            onPress={() => { setShowJoin(!showJoin); setShowCreate(false); }}
          >
            <Link color="white" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.actionBtnText}>Unirse con Código</Text>
          </TouchableOpacity>

          {showJoin && (
            <View style={styles.form}>
              <TextInput 
                style={styles.input}
                placeholder="Pega el código aquí..."
                placeholderTextColor="#6B7280"
                value={codigo}
                onChangeText={setCodigo}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleJoin}>
                <Text style={styles.submitBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#2563EB', marginTop: 12 }]}
            onPress={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          >
            <Plus color="white" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.actionBtnText}>Crear Nueva Liga</Text>
          </TouchableOpacity>

          {showCreate && (
            <View style={styles.form}>
              <TextInput 
                style={styles.input}
                placeholder="Nombre de tu liga..."
                placeholderTextColor="#6B7280"
                value={nombreLiga}
                onChangeText={setNombreLiga}
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitBtnText}>Crear Liga</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loaderContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F2937', marginBottom: 10 },
  logoutBtn: { padding: 10 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  ligasList: { marginTop: 10, marginBottom: 32 },
  ligaCard: { backgroundColor: '#1F2937', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  ligaIcon: { backgroundColor: '#111827', borderRadius: 12, marginRight: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  ligaName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  ligaCode: { color: '#6B7280', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  actions: { marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  form: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, marginTop: 8 },
  input: { backgroundColor: '#111827', color: 'white', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  submitBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: 'bold' }
});
