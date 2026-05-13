import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';
import { NoticiaLiga } from '../types';

export const useFeed = () => {
  const { selectedLigaId } = useAuthStore();
  const [noticias, setNoticias] = useState<NoticiaLiga[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNoticias = useCallback(async () => {
    if (!selectedLigaId) return;
    try {
      const response = await api.get(`/noticias/${selectedLigaId}`);
      setNoticias(response.data);
    } catch (error) {
      console.error("Error al cargar noticias:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLigaId]);

  useEffect(() => {
    setLoading(true);
    fetchNoticias();
  }, [fetchNoticias]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNoticias();
  }, [fetchNoticias]);

  return {
    noticias,
    loading,
    refreshing,
    onRefresh
  };
};
