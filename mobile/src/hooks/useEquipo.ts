import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { EquipoDetalleDTO } from '../types';

export const useEquipo = () => {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();
  
  const [equipo, setEquipo] = useState<EquipoDetalleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipo = useCallback(async (silent = false) => {
    if (!user || !selectedLigaId) return;
    
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/equipos/mi-equipo/${user.id}`, {
        params: { ligaId: selectedLigaId }
      });
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching equipo:', error);
      showToast('Error al cargar tu equipo', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedLigaId, showToast]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEquipo(true);
  }, [fetchEquipo]);

  const alinearJugador = useCallback(async (equipoId: number, jugadorId: number) => {
    try {
      await api.put('/equipos/alinear', {
        equipoId,
        jugadorId
      });
      // Recargamos los datos para ver el cambio reflejado
      await fetchEquipo(true);
      return true;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al cambiar la alineación';
      showToast(errorMsg, 'error');
      return false;
    }
  }, [fetchEquipo, showToast]);

  // Carga inicial
  useEffect(() => {
    fetchEquipo();
  }, [fetchEquipo]);

  return {
    equipo,
    loading,
    refreshing,
    onRefresh,
    fetchEquipo,
    alinearJugador
  };
};
