package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    // Busca el equipo que pertenece a un usuario concreto
    Optional<Equipo> findByUsuarioId(Long usuarioId);

    // Busca el equipo de un usuario en una liga específica
    Optional<Equipo> findByUsuarioIdAndLigaId(Long usuarioId, Long ligaId);

    // Devuelve todos los equipos ordenados por puntuación descendente
    List<Equipo> findAllByOrderByPuntuacionTotalDesc();
}