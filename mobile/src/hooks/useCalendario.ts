import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/api';
import { JornadaCalendario, PartidoCalendario } from '../types';

export const useCalendario = () => {
  const [calendario, setCalendario] = useState<JornadaCalendario[]>([]);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [calRes, timeRes] = await Promise.all([
        api.get('/partidos/calendario'),
        api.get('/public/time')
      ]);
      setCalendario(calRes.data);
      console.log("CALENDARIO DATA:", calRes.data.map((j: any) => ({ semana: j.semana, hasDias: !!j.dias })));
      setServerTime(new Date(timeRes.data.serverTime));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const proximoPartido = useMemo(() => {
    let matches: (PartidoCalendario & { semana: number })[] = [];
    calendario.forEach(j => {
      j.dias.forEach(d => {
        d.partidos.forEach(p => {
          matches.push({ ...p, semana: j.semana });
        });
      });
    });

    return matches
      .filter(m => new Date(m.fecha) > serverTime)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
  }, [calendario, serverTime]);

  const formatCountdown = (target: string) => {
    const diff = new Date(target).getTime() - serverTime.getTime();
    if (diff <= 0) return "¡EMPEZANDO!";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatFechaExtensa = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} DE ${meses[fecha.getMonth()]}`;
  };

  return {
    calendario,
    serverTime,
    loading,
    refreshing,
    onRefresh,
    proximoPartido,
    formatCountdown,
    formatFechaExtensa
  };
};
