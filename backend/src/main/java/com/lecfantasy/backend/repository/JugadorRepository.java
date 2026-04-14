package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO;
import com.lecfantasy.backend.entity.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    // Este método nos servirá para comprobar si un jugador ya existe en nuestra BD
    // buscando por su nickname (ej. "Caps") antes de guardarlo duplicado.
    Optional<Jugador> findByNickname(String nickname);

    @Query("SELECT new com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO(j, COALESCE(SUM(e.puntosGenerados), 0L)) " +
           "FROM Jugador j LEFT JOIN EstadisticaPartido e ON e.jugador = j " +
           "GROUP BY j " +
           "ORDER BY COALESCE(SUM(e.puntosGenerados), 0L) DESC")
    List<JugadorPuntuacionTotalDTO> findAllWithTotalPoints();
}