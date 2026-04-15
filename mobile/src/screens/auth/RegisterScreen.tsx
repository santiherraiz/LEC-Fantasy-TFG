import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!nombre || !nickname || !email || !password) {
      showToast('Por favor, rellena todos los campos', 'info');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/usuarios/registro', { nombre, nickname, email, password });
      showToast('¡Usuario creado! Ya puedes entrar', 'success');
      navigation.navigate('Login');
    } catch (error: any) {
      console.error(error);
      if (!error.response) {
        showToast('Error de conexión', 'error');
      } else {
        showToast('Error al crear usuario', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Únete a la liga</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre Completo" placeholderTextColor="#9CA3AF" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="Nickname" placeholderTextColor="#9CA3AF" value={nickname} onChangeText={setNickname} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />
        
        <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.button}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Registrarse</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2563EB', marginBottom: 32 },
  form: { width: '100%' },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, color: '#111827' },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontWeight: '600' }
});
