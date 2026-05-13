import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { JugadorPuntuacionTotal } from '../types';

export const useJugadoresRanking = () => {
  const [ranking, setRanking] = useState<JugadorPuntuacionTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = useCallback(async () => {
    try {
      const response = await api.get('/jugadores/ranking');
      setRanking(response.data);
    } catch (error) {
      console.error("Error fetching player ranking:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanking();
  };

  return {
    ranking,
    loading,
    refreshing,
    onRefresh
  };
};
