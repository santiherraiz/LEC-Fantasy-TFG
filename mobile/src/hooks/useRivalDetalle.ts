import { useState, useCallback } from 'react';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import api from '../api/api';
import { EquipoRivalDTO } from '../types';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Alert } from 'react-native';

export const useRivalDetalle = () => {
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { user, selectedLigaId } = useAuthStore();
  
  const [equipo, setEquipo] = useState<EquipoRivalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipoRival = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/equipos/rival/${id}`);
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching rival team:', error);
      showToast('Error al cargar el equipo rival', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchEquipoRival();
    }, [fetchEquipoRival])
  );

  const handleClausulazo = async (jugadorId: number, nickname: string, precioBase: number, precioActual: number) => {
    if (!user || !selectedLigaId) return;

    const precioFinal = precioActual || precioBase;
    const precioClausula = precioFinal * 1.5;

    Alert.alert(
      '¡CLAUSULAZO!',
      `¿Estás seguro de que quieres pagar la cláusula de ${nickname} por ${precioClausula.toLocaleString()} €?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'PAGAR CLÁUSULA',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/mercado/clausulazo', {
                compradorUsuarioId: user.id,
                jugadorId: jugadorId,
                ligaId: selectedLigaId
              });

              showToast(`¡Has robado a ${nickname} con éxito!`, 'success');
              fetchEquipoRival();
            } catch (error: any) {
              showToast(error.response?.data?.message || 'No se pudo ejecutar el clausulazo', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEquipoRival();
  };

  const isOwnTeam = user?.nickname === equipo?.nombreUsuario;
  const titulares = equipo?.jugadores.filter(j => j.estado === 'TITULAR') || [];
  const banquillo = equipo?.jugadores.filter(j => j.estado === 'BANQUILLO') || [];
  const valorPlantilla = equipo?.jugadores.reduce((acc, j) => acc + (j.precioActual || j.precioBase), 0) || 0;

  return {
    equipo,
    loading,
    refreshing,
    onRefresh,
    handleClausulazo,
    isOwnTeam,
    titulares,
    banquillo,
    valorPlantilla,
    user
  };
};
