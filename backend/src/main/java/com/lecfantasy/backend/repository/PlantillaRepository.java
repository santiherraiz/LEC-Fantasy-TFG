package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.entity.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {
    boolean existsByEquipoIdAndJugadorId(Long equipoId, Long jugadorId);

    List<Plantilla> findByEquipoId(Long equipoId);

    Optional<Plantilla> findByEquipoIdAndJugadorId(Long equipoId, Long jugadorId);

    List<Plantilla> findByEquipoIdAndEstado(Long equipoId, EstadoAlineacion estado);

    List<Plantilla> findByJugadorNicknameAndEstado(String nickname, EstadoAlineacion estado);

    List<Plantilla> findByEquipoLigaId(Long ligaId);

    List<Plantilla> findByJugadorId(Long jugadorId);
}