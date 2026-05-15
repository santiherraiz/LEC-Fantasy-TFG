package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    Optional<Equipo> findByUsuarioId(Long usuarioId);

    Optional<Equipo> findByUsuarioIdAndLigaId(Long usuarioId, Long ligaId);

    List<Equipo> findAllByLigaIdOrderByPuntuacionTotalDesc(Long ligaId);

    List<Equipo> findAllByOrderByPuntuacionTotalDesc();
}