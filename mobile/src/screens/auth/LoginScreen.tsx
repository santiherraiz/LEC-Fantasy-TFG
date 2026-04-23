import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Por favor, rellena todos los campos', 'info');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/usuarios/login', { email, password });
      const { token, usuario } = response.data;
      setAuth(usuario, token);
    } catch (error: any) {
      // Usamos el mensaje limpio que ya viene del interceptor de API
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fantasy LEC</Text>
      <Text style={styles.subtitle}>Tu liga, tus reglas</Text>
      
      <View style={styles.form}>
        <TextInput 
          style={styles.input}
          placeholder="Email" 
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input}
          placeholder="Contraseña" 
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          style={[styles.button, loading && { opacity: 0.7 }]}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          style={styles.link}
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 24 },
  title: { fontSize: 36, fontWeight: '900', color: '#2563EB', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#6B7280', marginBottom: 40 },
  form: { width: '100%' },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, fontSize: 16, color: '#111827' },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontWeight: '600' }
});
