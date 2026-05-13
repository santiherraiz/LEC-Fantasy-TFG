import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { CatalogoJugador } from '../types';

export type SortType = 'PUNTOS' | 'PRECIO';
export type SortOrder = 'MAYOR' | 'MENOR';
export type ActiveFilterTab = 'POSICION' | 'EQUIPO' | null;

export const useCatalogo = () => {
  const { user, selectedLigaId } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [catalogo, setCatalogo] = useState<CatalogoJugador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<ActiveFilterTab>(null);
  const [filterPos, setFilterPos] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('PUNTOS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('MAYOR');

  const fetchData = useCallback(async () => {
    if (!user?.id || !selectedLigaId) return;
    
    try {
      const res = await api.get('/mercado/catalogo', { 
        params: { ligaId: selectedLigaId } 
      });
      setCatalogo(res.data);
    } catch (error) {
      console.error("Error cargando catálogo:", error);
      showToast("Error al cargar catálogo", "error");
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

  // Extract unique teams and positions from data dynamically
  const availableTeams = useMemo(() => {
    const teams = catalogo.map(item => item.jugador.equipoLec?.nombre).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [catalogo]);

  const availablePositions = useMemo(() => {
    const positions = catalogo.map(item => item.jugador.rol).filter(Boolean);
    return Array.from(new Set(positions)).sort();
  }, [catalogo]);

  // Derived filtered data
  const filteredCatalogo = useMemo(() => {
    let result = [...catalogo];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.jugador.nickname.toLowerCase().includes(query)
      );
    }

    // 2. Position Filter
    if (filterPos) {
      result = result.filter(item => item.jugador.rol === filterPos);
    }

    // 3. Team Filter
    if (filterTeam) {
      result = result.filter(item => item.jugador.equipoLec?.nombre === filterTeam);
    }

    // 4. Sorting
    result.sort((a, b) => {
      const valA = sortType === 'PUNTOS'
        ? (a.puntosTotales || 0)
        : (a.jugador.precioActual || a.jugador.precioBase || 0);
      const valB = sortType === 'PUNTOS'
        ? (b.puntosTotales || 0)
        : (b.jugador.precioActual || b.jugador.precioBase || 0);

      return sortOrder === 'MAYOR'
        ? valB - valA
        : valA - valB;
    });

    return result;
  }, [catalogo, searchQuery, filterPos, filterTeam, sortType, sortOrder]);

  const toggleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(prev => prev === 'MAYOR' ? 'MENOR' : 'MAYOR');
    } else {
      setSortType(type);
      setSortOrder('MAYOR');
    }
    setActiveTab(null);
  };

  const toggleFilterTab = (tab: ActiveFilterTab) => {
    setActiveTab(prev => prev === tab ? null : tab);
  };

  const setPosition = (pos: string | null) => {
    setFilterPos(pos);
    setActiveTab(null);
  };

  const setTeam = (team: string | null) => {
    setFilterTeam(team);
    setActiveTab(null);
  };

  return {
    user,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    activeTab,
    filterPos,
    filterTeam,
    sortType,
    sortOrder,
    availableTeams,
    availablePositions,
    filteredCatalogo,
    handleRefresh,
    toggleSort,
    toggleFilterTab,
    setPosition,
    setTeam
  };
};
