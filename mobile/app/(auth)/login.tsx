import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { useAuthStore } from '../../src/store/authStore';
import { useToast } from '../../src/context/ToastContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

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
      // Autorefresh should handle redirection via RootLayout
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-midnight items-center justify-center p-8">
      <View className="mb-10 items-center w-full">
        <View className="w-full h-48 items-center justify-center">
          <Image 
            source={require('../../assets/logos/IMAGOTIPO-bg.png')} 
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
        <Text className="text-gray-500 font-black uppercase tracking-[6px] mt-2 text-[12px]">Tu liga, tus reglas</Text>
      </View>
      
      <View className="w-full">
        <TextInput 
          className="bg-surface p-5 rounded-2xl border border-surface-light/30 mb-4 text-white text-base"
          placeholder="Email" 
          placeholderTextColor="#4A5568"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          className="bg-surface p-5 rounded-2xl border border-surface-light/30 mb-6 text-white text-base"
          placeholder="Contraseña" 
          placeholderTextColor="#4A5568"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className={`bg-accent-cyan p-5 rounded-2xl items-center shadow-lg shadow-accent-cyan/20 ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? <ActivityIndicator color="#0B0E14" /> : <Text className="text-midnight font-black text-lg uppercase tracking-widest">Entrar</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/register')}
          className="mt-8 items-center"
        >
          <Text className="text-accent-cyan font-bold">¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
