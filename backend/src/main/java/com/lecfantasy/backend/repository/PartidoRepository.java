package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, String> {

    // Método clave para el futuro: "Dame todos los partidos que aún no he puntuado"
    List<Partido> findByPuntosCalculadosFalse();
}