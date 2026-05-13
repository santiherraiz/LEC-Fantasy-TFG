import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import api from '../api/api';
import { EquipoJornadaDTO, Jornada } from '../types';

export const useEquipoJornada = () => {
  const { id, jornadaId: paramJornadaId } = useLocalSearchParams();
  const [equipo, setEquipo] = useState<EquipoJornadaDTO | null>(null);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipoJornada = useCallback(async (equipoId: string, jId: number) => {
    try {
      const response = await api.get(`/equipos/${equipoId}/jornada/${jId}`);
      setEquipo(response.data);
    } catch (error) {
      console.error('Error fetching team week:', error);
      setEquipo(null);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Obtener todas las jornadas para el selector
      const jornadasRes = await api.get('/jornadas');
      const allJornadas = jornadasRes.data
        .filter((j: Jornada) => j.estado !== 'PROGRAMADA')
        .sort((a: Jornada, b: Jornada) => b.numeroSemana - a.numeroSemana);
      setJornadas(allJornadas);

      // 2. Determinar qué jornada mostrar
      let currentJ: Jornada | null = null;
      if (paramJornadaId) {
        currentJ = allJornadas.find((j: Jornada) => j.id.toString() === paramJornadaId) || null;
      } else if (allJornadas.length > 0) {
        currentJ = allJornadas[0];
      } else {
        const actualRes = await api.get('/jornadas/actual');
        currentJ = actualRes.data;
      }

      setSelectedJornada(currentJ);
      if (currentJ) {
        await fetchEquipoJornada(id as string, currentJ.id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, paramJornadaId, fetchEquipoJornada]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData();
  }, [fetchInitialData]);

  const changeJornada = async (newJ: Jornada | undefined) => {
    if (!newJ || !newJ.id) return;
    setRefreshing(true);
    setSelectedJornada(newJ);
    await fetchEquipoJornada(id as string, newJ.id);
    setRefreshing(false);
  };

  const currentIndex = jornadas.findIndex(j => j.id === selectedJornada?.id);

  const handleNextJornada = () => {
    if (currentIndex > 0) {
      changeJornada(jornadas[currentIndex - 1]);
    }
  };

  const handlePrevJornada = () => {
    if (currentIndex < jornadas.length - 1 && currentIndex !== -1) {
      changeJornada(jornadas[currentIndex + 1]);
    }
  };

  return {
    equipo,
    jornadas,
    selectedJornada,
    loading,
    refreshing,
    currentIndex,
    onRefresh,
    handleNextJornada,
    handlePrevJornada
  };
};
