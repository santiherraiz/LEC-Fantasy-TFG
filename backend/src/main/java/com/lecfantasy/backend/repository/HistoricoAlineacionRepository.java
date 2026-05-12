package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.HistoricoAlineacion;
import com.lecfantasy.backend.entity.Jornada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface HistoricoAlineacionRepository extends JpaRepository<HistoricoAlineacion, Long> {
    List<HistoricoAlineacion> findByJornada(Jornada jornada);
    List<HistoricoAlineacion> findByJornadaNumeroSemana(Integer semana);
    List<HistoricoAlineacion> findByEquipoIdAndJornada(Long equipoId, Jornada jornada);

    @Query("SELECT h.equipo.id, h.equipo.usuario.nickname, SUM(h.puntosSemanales) as total " +
           "FROM HistoricoAlineacion h " +
           "WHERE h.equipo.liga.id = :ligaId AND h.jornada.id = :jornadaId AND h.estado = com.lecfantasy.backend.entity.EstadoAlineacion.TITULAR " +
           "GROUP BY h.equipo.id, h.equipo.usuario.nickname " +
           "ORDER BY total DESC")
    List<Object[]> findRankingByJornada(@Param("ligaId") Long ligaId, @Param("jornadaId") Long jornadaId);
}
