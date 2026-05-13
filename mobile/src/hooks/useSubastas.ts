import { useState, useEffect, useCallback } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { Subasta } from '../types';

export const useSubastas = () => {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [selectedSubasta, setSelectedSubasta] = useState<Subasta | null>(null);
  const [pujaAmount, setPujaAmount] = useState('');
  const [presupuesto, setPresupuesto] = useState<number | null>(null);
  const [pujaModalVisible, setPujaModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [tick, setTick] = useState(0);

  // Keyboard listeners
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

  // Timer to update UI every second
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const parseDate = (dateData: any) => {
    if (!dateData) return new Date();
    if (Array.isArray(dateData)) {
      // Jackson format: [year, month, day, hour, minute, second]
      return new Date(dateData[0], dateData[1] - 1, dateData[2], dateData[3], dateData[4], dateData[5] || 0);
    }
    return new Date(dateData);
  };

  const fetchData = useCallback(async () => {
    if (!user?.id || !selectedLigaId) return;
    
    try {
      const [subastasRes, equipoRes, timeRes] = await Promise.all([
        api.get('/mercado/subastas', {
          params: { ligaId: selectedLigaId, usuarioId: user.id }
        }),
        api.get(`/equipos/mi-equipo/${user.id}`, {
          params: { ligaId: selectedLigaId }
        }),
        api.get('/public/time')
      ]);

      const serverDate = parseDate(timeRes.data.serverTime);
      const localNow = Date.now();
      const newOffset = serverDate.getTime() - localNow;
      
      console.log(`[Subastas] Server: ${serverDate.toISOString()}, Local: ${new Date(localNow).toISOString()}, Offset: ${newOffset}ms`);
      
      setServerTimeOffset(newOffset);
      
      // We no longer calculate localEndTime based on secondsRestantes here
      // to avoid jumps. We'll use fechaFin + serverTimeOffset in getTimeRemaining.
      setSubastas(subastasRes.data);
      setPresupuesto(equipoRes.data.presupuestoDisponible);
    } catch (error) {
      console.error("Error cargando subastas o presupuesto:", error);
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedLigaId, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handlePujar = async () => {
    if (!selectedSubasta || !pujaAmount) return;
    const amount = parseFloat(pujaAmount);
    
    if (isNaN(amount) || amount <= 0) {
      showToast("Introduce una cantidad válida", "error");
      return;
    }

    const minPrice = selectedSubasta.jugador.precioActual || selectedSubasta.jugador.precioBase;

    if (amount < minPrice) {
      showToast(`La puja mínima es de ${minPrice.toLocaleString()} €`, "error");
      return;
    }

    if (presupuesto !== null && amount > presupuesto + (selectedSubasta.miPuja || 0)) {
      showToast("No tienes suficiente presupuesto", "error");
      return;
    }

    try {
      const res = await api.post('/mercado/pujar', {
        subastaId: selectedSubasta.id,
        usuarioId: user?.id,
        cantidad: amount
      });
      showToast(res.data.message || "Puja realizada", "success");
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
      showToast(res.data.message || "Puja retirada", "success");
      setDeleteModalVisible(false);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Error al retirar puja", "error");
    }
  };

  const getTimeRemaining = (subasta: any) => {
    const simulatedNow = Date.now() + serverTimeOffset;
    const end = parseDate(subasta.fechaFin).getTime();
    const total = end - simulatedNow;

    if (total <= 0) return "Finalizado";
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const openPujaModal = (subasta: Subasta) => {
    setSelectedSubasta(subasta);
    setPujaAmount(subasta.miPuja?.toString() || '');
    setPujaModalVisible(true);
  };

  const openDeleteModal = (subasta: Subasta) => {
    setSelectedSubasta(subasta);
    setDeleteModalVisible(true);
  };

  return {
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
    tick // Exposed just in case, though usually internal timer handles it
  };
};
