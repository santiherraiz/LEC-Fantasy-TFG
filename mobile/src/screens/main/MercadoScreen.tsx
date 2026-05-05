import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import api from '../../api/api';
import { Subasta, CatalogoJugador } from '../../types';
import { Search, Filter, Gavel, BookOpen, Clock, TrendingUp, User as UserIcon, X, ChevronRight, Info, Trash2 } from 'lucide-react-native';

export default function MercadoScreen({ navigation }: any) {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'SUBASTA' | 'CATALOGO'>('SUBASTA');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Keyboard tracking
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Auction state
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [selectedSubasta, setSelectedSubasta] = useState<Subasta | null>(null);
  const [pujaAmount, setPujaAmount] = useState('');
  const [pujaModalVisible, setPujaModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Catalog state
  const [catalogo, setCatalogo] = useState<CatalogoJugador[]>([]);
  const [filteredCatalogo, setFilteredCatalogo] = useState<CatalogoJugador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPos, setFilterPos] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id || !selectedLigaId) return;
    setLoading(true);
    try {
      if (activeTab === 'SUBASTA') {
        const res = await api.get('/mercado/subastas', {
          params: { ligaId: selectedLigaId, usuarioId: user.id }
        });
        setSubastas(res.data);
      } else {
        const res = await api.get('/mercado/catalogo', {
          params: { ligaId: selectedLigaId }
        });
        setCatalogo(res.data);
        applyFilters(res.data, searchQuery, filterPos);
      }
    } catch (error) {
      console.error("Error cargando mercado:", error);
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLigaId, activeTab]);

  const applyFilters = (data: CatalogoJugador[], search: string, pos: string | null) => {
    let filtered = data;
    if (search) {
      filtered = filtered.filter(item => 
        item.jugador.nickname.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (pos) {
      filtered = filtered.filter(item => item.jugador.rol === pos);
    }
    setFilteredCatalogo(filtered);
  };

  useEffect(() => {
    applyFilters(catalogo, searchQuery, filterPos);
  }, [searchQuery, filterPos]);

  const handlePujar = async () => {
    if (!selectedSubasta || !pujaAmount) return;
    const amount = parseFloat(pujaAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Introduce una cantidad válida", "error");
      return;
    }

    try {
      const res = await api.post('/mercado/pujar', {
        subastaId: selectedSubasta.id,
        usuarioId: user?.id,
        cantidad: amount
      });
      showToast(res.data, "success");
      setPujaModalVisible(false);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Error al pujar", "error");
    }
  };

  const handleEliminarPuja = async () => {
    if (!selectedSubasta) return;
    try {
      const res = await api.delete('/mercado/pujar', {
        params: { subastaId: selectedSubasta.id, usuarioId: user?.id }
      });
      showToast(res.data, "success");
      setDeleteModalVisible(false);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Error al retirar puja", "error");
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const total = Date.parse(endTime) - Date.parse(new Date().toString());
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  const SubastaCard = ({ subasta }: { subasta: Subasta }) => (
    <View className="bg-surface rounded-3xl mb-4 border border-surface-light/30 overflow-hidden">
      <View className="p-5 flex-row items-center">
        <View className="w-16 h-16 bg-midnight rounded-2xl items-center justify-center border border-accent-cyan/20">
          {subasta.jugador.equipoLec?.logoUrl ? (
            <Image source={{ uri: subasta.jugador.equipoLec.logoUrl }} className="w-10 h-10" resizeMode="contain" />
          ) : (
            <Text className="text-white font-bold">{subasta.jugador.nickname.charAt(0)}</Text>
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-white font-black text-xl">{subasta.jugador.nickname}</Text>
          <View className="flex-row items-center mt-1">
            <View className="bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20 mr-2">
               <Text className="text-accent-cyan text-[10px] font-black uppercase">{subasta.jugador.rol}</Text>
            </View>
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">{subasta.jugador.equipoLec?.nombre}</Text>
          </View>
        </View>
        <View className="items-end">
           <Text className="text-neon-green font-black text-lg">{subasta.jugador.precioBase.toLocaleString()} €</Text>
           <Text className="text-gray-500 text-[10px] font-bold uppercase">PRECIO BASE</Text>
        </View>
      </View>

      <View className="bg-midnight/50 px-5 py-4 flex-row items-center justify-between border-t border-surface-light/10">
        <View className="flex-row items-center">
          <Clock size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs font-bold ml-2">Finaliza en {getTimeRemaining(subasta.fechaFin)}</Text>
        </View>
        
        <View className="flex-row items-center">
          {subasta.miPuja && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedSubasta(subasta);
                setDeleteModalVisible(true);
              }}
              className="w-10 h-10 bg-crimson/10 rounded-xl items-center justify-center border border-crimson/40 mr-2 shadow-sm shadow-crimson/20"
            >
              <Trash2 size={18} color="#FF003F" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => {
              setSelectedSubasta(subasta);
              setPujaAmount(subasta.miPuja?.toString() || '');
              setPujaModalVisible(true);
            }}
            className={`px-6 py-2 rounded-xl flex-row items-center ${subasta.miPuja ? 'bg-accent-cyan' : 'bg-surface-light/50'}`}
          >
            <Gavel size={16} color={subasta.miPuja ? '#0B0E14' : 'white'} />
            <Text className={`font-black text-xs ml-2 ${subasta.miPuja ? 'text-midnight' : 'text-white'}`}>
              {subasta.miPuja ? `EDITAR: ${subasta.miPuja.toLocaleString()} €` : 'PUJAR'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-midnight">
      {/* Tab Header */}
      <View className="px-4 mt-4">
        <Text className="text-white text-3xl font-black tracking-tighter mb-6 italic">EL MERCADO</Text>
        
        <View className="flex-row bg-surface p-1.5 rounded-2xl border border-surface-light/20 mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('SUBASTA')}
            className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${activeTab === 'SUBASTA' ? 'bg-accent-cyan shadow-lg shadow-accent-cyan/20' : ''}`}
          >
            <Gavel size={18} color={activeTab === 'SUBASTA' ? '#0B0E14' : '#9CA3AF'} />
            <Text className={`font-black text-sm ml-2 ${activeTab === 'SUBASTA' ? 'text-midnight' : 'text-gray-500'}`}>SUBASTA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('CATALOGO')}
            className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${activeTab === 'CATALOGO' ? 'bg-accent-cyan shadow-lg shadow-accent-cyan/20' : ''}`}
          >
            <BookOpen size={18} color={activeTab === 'CATALOGO' ? '#0B0E14' : '#9CA3AF'} />
            <Text className={`font-black text-sm ml-2 ${activeTab === 'CATALOGO' ? 'text-midnight' : 'text-gray-500'}`}>CATÁLOGO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor="#00D1FF" />}
      >
        {activeTab === 'SUBASTA' ? (
          <View>
            <View className="flex-row items-center mb-6 bg-accent-cyan/5 p-4 rounded-2xl border border-dashed border-accent-cyan/20">
               <Info size={20} color="#00D1FF" />
               <Text className="text-gray-400 text-[11px] leading-4 font-medium flex-1 ml-3">
                 5 jugadores aleatorios cada 24 horas. Las pujas son <Text className="text-accent-cyan font-bold">anónimas</Text>. ¡Gana el que más dinero ponga!
               </Text>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#00D1FF" className="mt-10" />
            ) : subastas.length > 0 ? (
              subastas.map(s => <SubastaCard key={s.id} subasta={s} />)
            ) : (
              <View className="items-center justify-center py-20">
                <Text className="text-gray-500 italic text-center">No hay subastas activas en este momento</Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Catalog Filters */}
            <View className="mb-6">
              <View className="flex-row items-center bg-surface p-4 rounded-2xl border border-surface-light/30 mb-4">
                <Search size={20} color="#4B5563" />
                <TextInput 
                  className="flex-1 ml-3 text-white font-bold"
                  placeholder="Buscar jugador..."
                  placeholderTextColor="#4B5563"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity 
                  onPress={() => setFilterPos(null)}
                  className={`px-4 py-2 rounded-full mr-2 border ${filterPos === null ? 'bg-accent-cyan border-accent-cyan' : 'bg-surface border-surface-light/30'}`}
                >
                  <Text className={`font-black text-[10px] ${filterPos === null ? 'text-midnight' : 'text-gray-500'}`}>TODOS</Text>
                </TouchableOpacity>
                {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(pos => (
                  <TouchableOpacity 
                    key={pos}
                    onPress={() => setFilterPos(pos)}
                    className={`px-4 py-2 rounded-full mr-2 border ${filterPos === pos ? 'bg-accent-cyan border-accent-cyan' : 'bg-surface border-surface-light/30'}`}
                  >
                    <Text className={`font-black text-[10px] ${filterPos === pos ? 'text-midnight' : 'text-gray-500'}`}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#00D1FF" className="mt-10" />
            ) : (
              filteredCatalogo.map(item => (
                <TouchableOpacity 
                  key={item.jugador.id}
                  onPress={() => navigation.navigate('JugadorDetail', { id: item.jugador.id })}
                  className="bg-surface p-4 rounded-2xl mb-3 flex-row items-center border border-surface-light/20"
                >
                  <View className="w-12 h-12 bg-midnight rounded-xl items-center justify-center mr-4 border border-surface-light/30">
                    <Text className="text-accent-cyan font-black text-xs">{item.jugador.rol.substring(0, 3)}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{item.jugador.nickname}</Text>
                    <View className="flex-row items-center mt-1">
                      {item.propietarioNickname ? (
                        <View className="flex-row items-center">
                          <UserIcon size={10} color="#9CA3AF" />
                          <Text className="text-gray-500 text-[10px] font-bold ml-1 uppercase">{item.propietarioNickname}</Text>
                        </View>
                      ) : (
                        <Text className="text-neon-green text-[10px] font-bold uppercase tracking-widest">LIBRE</Text>
                      )}
                    </View>
                  </View>

                  <View className="items-end mr-3">
                    <View className="flex-row items-center">
                       <TrendingUp size={12} color="#00D1FF" />
                       <Text className="text-white font-black text-lg ml-1.5">{item.puntosMedia}</Text>
                    </View>
                    <Text className="text-gray-500 text-[9px] font-bold">MEDIA</Text>
                  </View>
                  <ChevronRight size={18} color="#2D3748" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Puja Modal */}
      <Modal
        visible={pujaModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setPujaModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-midnight/80 justify-end">
            <View 
              style={{ 
                paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + 24,
                transform: [{ translateY: keyboardHeight > 0 ? -10 : 0 }]
              }}
              className="bg-surface rounded-t-[40px] p-8 border-t border-accent-cyan/30 shadow-2xl"
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-2xl font-black italic">
                  {selectedSubasta?.miPuja ? 'EDITAR PUJA' : 'HACER PUJA'}
                </Text>
                <TouchableOpacity onPress={() => setPujaModalVisible(false)}>
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-400 font-bold text-center mb-8">
                Estás {selectedSubasta?.miPuja ? 'editando tu puja' : 'pujando'} por <Text className="text-white">{selectedSubasta?.jugador.nickname}</Text>.
                {'\n'}Precio base: <Text className="text-neon-green">{selectedSubasta?.jugador.precioBase.toLocaleString()} €</Text>
              </Text>

              <View className="bg-midnight rounded-3xl p-6 border border-surface-light/30 mb-8">
                <Text className="text-gray-500 text-[10px] font-black uppercase text-center mb-2 tracking-widest">TU OFERTA (€)</Text>
                <TextInput 
                  className="text-white text-4xl font-black text-center"
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#2D3748"
                  value={pujaAmount}
                  onChangeText={setPujaAmount}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity 
                onPress={handlePujar}
                className="bg-accent-cyan p-5 rounded-2xl items-center shadow-2xl shadow-accent-cyan/50"
              >
                <Text className="text-midnight font-black text-lg uppercase">
                  {selectedSubasta?.miPuja ? 'ACTUALIZAR PUJA' : 'CONFIRMAR PUJA'}
                </Text>
              </TouchableOpacity>
              
              <Text className="text-gray-500 text-[10px] text-center mt-6 font-bold leading-4">
                El dinero será bloqueado de tu presupuesto.{'\n'}Se devolverá si no ganas o si retiras la puja.
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 bg-midnight/95 justify-center px-8">
          <View className="bg-surface rounded-3xl p-8 border border-crimson/30 items-center">
            <View className="w-20 h-20 bg-crimson/10 rounded-full items-center justify-center mb-6 border border-crimson/20">
              <Trash2 size={40} color="#FF003F" />
            </View>
            
            <Text className="text-white text-2xl font-black text-center mb-2 italic">¿RETIRAR PUJA?</Text>
            <Text className="text-gray-400 text-center font-medium leading-5 mb-8">
              Si retiras tu puja por <Text className="text-white font-bold">{selectedSubasta?.jugador.nickname}</Text>, el dinero se devolverá inmediatamente a tu presupuesto.
            </Text>

            <View className="flex-row w-full">
              <TouchableOpacity 
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 bg-surface-light/50 py-4 rounded-2xl mr-3 border border-surface-light/30"
              >
                <Text className="text-white font-bold text-center">CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleEliminarPuja}
                className="flex-1 bg-crimson py-4 rounded-2xl shadow-lg shadow-crimson/30"
              >
                <Text className="text-white font-black text-center uppercase">RETIRAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
