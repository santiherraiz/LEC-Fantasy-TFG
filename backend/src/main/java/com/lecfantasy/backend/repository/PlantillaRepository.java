package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {
    // Comprueba si un equipo ya tiene a un jugador específico (para evitar trampas)
    boolean existsByEquipoIdAndJugadorId(Long equipoId, Long jugadorId);

    // Buscar a todos los jugadores de un equipo concreto
    List<Plantilla> findByEquipoId(Long equipoId);
}