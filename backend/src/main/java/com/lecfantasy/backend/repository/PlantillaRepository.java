package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {
    // Comprueba si un equipo ya tiene a un jugador específico (para evitar trampas)
    boolean existsByEquipoIdAndJugadorId(Long equipoId, Long jugadorId);
}