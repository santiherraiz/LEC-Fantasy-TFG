import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, TextInput, Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Link } from 'expo-router';
import { useSubastas } from '../../../src/hooks/useSubastas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Subasta } from '../../../src/types';
import { Gavel, Clock, X, Info, Trash2, Wallet, User as UserIcon } from 'lucide-react-native';
import CustomHeader from '../../../src/components/CustomHeader';

export default function SubastasScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    refreshing,
    subastas,
    selectedSubasta,
    pujaAmount,
    setPujaAmount,
    presupuesto,
    pujaModalVisible,
    setPujaModalVisible,
    deleteModalVisible,
    setDeleteModalVisible,
    keyboardHeight,
    handleRefresh,
    handlePujar,
    handleEliminarPuja,
    getTimeRemaining,
    openPujaModal,
    openDeleteModal,
    tick
  } = useSubastas();

  const SubastaCard = ({ subasta }: { subasta: Subasta }) => (
    <View className="bg-surface rounded-3xl mb-4 border border-surface-light/30 overflow-hidden">
      <Link href={`/jugador/${subasta.jugador.id}`} asChild>
        <TouchableOpacity className="p-5 flex-row items-center">
          <View className="w-24 h-24 bg-midnight/50 rounded-3xl items-center justify-center border border-surface-light/30 overflow-hidden relative shadow-inner">
            
            {subasta.jugador.imagenUrl ? (
              <Image 
                source={{ uri: subasta.jugador.imagenUrl }} 
                className="w-24 h-24" 
                style={{ marginTop: 12 }}
                resizeMode="contain" 
              />
            ) : (
              <UserIcon size={32} color="#00D1FF" />
            )}

            {/* ESCUDO FLOTANTE: Logo limpio sin fondo circular */}
            {subasta.jugador.equipoLec?.logoUrl && (
              <View className="absolute top-1 left-1">
                <Image 
                  source={{ uri: subasta.jugador.equipoLec.logoUrl }} 
                  className="w-7 h-7" 
                  resizeMode="contain" 
                />
              </View>
            )}
          </View>
          <View className="ml-5 flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-black text-xl tracking-tight mr-3">{subasta.jugador.nickname}</Text>
              {/* CHIP DE POSICIÓN */}
              <View className="bg-accent-cyan/10 border border-accent-cyan/40 px-2 py-0.5 rounded-md">
                <Text className="text-accent-cyan font-black text-[9px] uppercase italic">
                  {subasta.jugador.rol.toUpperCase() === 'SUPPORT' ? 'SUPP' : subasta.jugador.rol}
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {subasta.jugador.equipoLec?.nombre}
            </Text>
          </View>
          <View className="items-end">
             <Text className="text-neon-green font-black text-lg">{(subasta.jugador.precioActual || subasta.jugador.precioBase).toLocaleString()} €</Text>
             <Text className="text-gray-500 text-[10px] font-bold uppercase">VALOR MERCADO</Text>
          </View>
        </TouchableOpacity>
      </Link>

      <View className="bg-midnight/50 px-5 py-4 flex-row items-center justify-between border-t border-surface-light/10">
        <View className="flex-row items-center">
          <Clock size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs font-bold ml-2">Finaliza en {getTimeRemaining(subasta)}</Text>
        </View>
        
        <View className="flex-row items-center">
          {subasta.miPuja && (
            <TouchableOpacity 
              onPress={() => openDeleteModal(subasta)}
              className="w-10 h-10 bg-crimson/10 rounded-xl items-center justify-center border border-crimson/40 mr-2 shadow-sm shadow-crimson/20"
            >
              <Trash2 size={18} color="#FF003F" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => openPujaModal(subasta)}
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
    <View className="flex-1 bg-midnight">
      <CustomHeader />
      <View className="px-4 mt-4">
        <Text className="text-white text-3xl font-black tracking-tighter mb-6 italic">SUBASTAS</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00D1FF" />}
      >
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

              <Text className="text-gray-400 font-bold text-center mb-4">
                Estás {selectedSubasta?.miPuja ? 'editando tu puja' : 'pujando'} por <Text className="text-white">{selectedSubasta?.jugador.nickname}</Text>.
                {'\n'}Precio actual: <Text className="text-neon-green">{(selectedSubasta?.jugador.precioActual || selectedSubasta?.jugador.precioBase || 0).toLocaleString()} €</Text>
              </Text>

              <View className="flex-row justify-center mb-8">
                <View className="bg-surface-light/10 px-4 py-2 rounded-xl border border-surface-light/20 flex-row items-center">
                  <Wallet size={14} color="#9CA3AF" />
                  <Text className="text-gray-400 text-[10px] font-black ml-2 uppercase">SALDO: </Text>
                  <Text className="text-white text-[10px] font-black">{presupuesto?.toLocaleString()} €</Text>
                </View>
              </View>

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
                disabled={!pujaAmount || isNaN(parseFloat(pujaAmount))}
                className={`p-5 rounded-2xl items-center shadow-2xl ${(!pujaAmount || isNaN(parseFloat(pujaAmount))) ? 'bg-gray-700' : 'bg-accent-cyan shadow-accent-cyan/50'}`}
              >
                <Text className="text-midnight font-black text-lg uppercase">
                  {selectedSubasta?.miPuja ? 'ACTUALIZAR PUJA' : 'CONFIRMAR PUJA'}
                </Text>
              </TouchableOpacity>

              {pujaAmount && !isNaN(parseFloat(pujaAmount)) && presupuesto !== null && (
                <Text className="text-center mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Saldo tras puja: <Text className={presupuesto + (selectedSubasta?.miPuja || 0) - parseFloat(pujaAmount) < 0 ? "text-crimson" : "text-neon-green"}>
                    {(presupuesto + (selectedSubasta?.miPuja || 0) - parseFloat(pujaAmount)).toLocaleString()} €
                  </Text>
                </Text>
              )}
              
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
    </View>
  );
}
