package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.HistoricoAlineacion;
import com.lecfantasy.backend.entity.Jornada;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoricoAlineacionRepository extends JpaRepository<HistoricoAlineacion, Long> {
    List<HistoricoAlineacion> findByJornada(Jornada jornada);
    List<HistoricoAlineacion> findByJornadaNumeroSemana(Integer semana);
    List<HistoricoAlineacion> findByEquipoIdAndJornada(Long equipoId, Jornada jornada);
}
