package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.HistoricoAlineacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoricoAlineacionRepository extends JpaRepository<HistoricoAlineacion, Long> {
    List<HistoricoAlineacion> findBySemana(Integer semana);
    List<HistoricoAlineacion> findByEquipoIdAndSemana(Long equipoId, Integer semana);
}