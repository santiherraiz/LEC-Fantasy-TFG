import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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
      await api.post('/usuarios/registro', { nombre, nickname, email, password });
      showToast('¡Usuario creado! Ya puedes entrar', 'success');
      navigation.navigate('Login');
    } catch (error: any) {
      console.error(error);
      showToast('Error al crear usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-midnight items-center justify-center p-8">
      <View className="mb-10 items-center">
        <Image 
          source={require('../../../assets/logos/IMAGOTIPO-bg.png')} 
          className="w-56 h-24"
          resizeMode="contain"
        />
        <Text className="text-gray-500 font-black uppercase tracking-[4px] -mt-4 text-[8px]">Únete a la competición</Text>
      </View>
      
      <View className="w-full">
        <TextInput 
          className="bg-surface p-4 rounded-2xl border border-surface-light/30 mb-4 text-white"
          placeholder="Nombre Completo" 
          placeholderTextColor="#4A5568" 
          value={nombre} 
          onChangeText={setNombre} 
        />
        <TextInput 
          className="bg-surface p-4 rounded-2xl border border-surface-light/30 mb-4 text-white"
          placeholder="Nickname" 
          placeholderTextColor="#4A5568" 
          value={nickname} 
          onChangeText={setNickname} 
        />
        <TextInput 
          className="bg-surface p-4 rounded-2xl border border-surface-light/30 mb-4 text-white"
          placeholder="Email" 
          placeholderTextColor="#4A5568" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
        <TextInput 
          className="bg-surface p-4 rounded-2xl border border-surface-light/30 mb-6 text-white"
          placeholder="Contraseña" 
          placeholderTextColor="#4A5568" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        
        <TouchableOpacity 
          onPress={handleRegister} 
          disabled={loading} 
          className={`bg-accent-cyan p-5 rounded-2xl items-center shadow-lg shadow-accent-cyan/20 ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? <ActivityIndicator color="#0B0E14" /> : <Text className="text-midnight font-black text-lg uppercase tracking-widest">Registrarse</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-8 items-center">
          <Text className="text-accent-cyan font-bold">¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
