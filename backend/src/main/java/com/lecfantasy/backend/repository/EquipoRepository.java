package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    // Busca el equipo que pertenece a un usuario concreto
    Optional<Equipo> findByUsuarioId(Long usuarioId);
}