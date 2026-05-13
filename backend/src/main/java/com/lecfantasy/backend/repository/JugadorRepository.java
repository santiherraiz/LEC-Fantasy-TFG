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
       Optional<Jugador> findByNickname(String nickname);

       @Query("SELECT new com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO(j, COALESCE(SUM(e.puntosGenerados), 0.0)) "
                     +
                     "FROM Jugador j LEFT JOIN EstadisticaPartido e ON e.jugador = j " +
                     "GROUP BY j " +
                     "ORDER BY COALESCE(SUM(e.puntosGenerados), 0.0) DESC")
       List<JugadorPuntuacionTotalDTO> findAllWithTotalPoints();

       @Query("SELECT j FROM Jugador j WHERE j.rol = :rol " +
                     "AND j.id NOT IN (SELECT p.jugador.id FROM Plantilla p WHERE p.equipo.liga.id = :ligaId) " +
                     "AND j.id NOT IN (SELECT s.jugador.id FROM Subasta s WHERE s.liga.id = :ligaId AND s.finalizada = false)")
       List<Jugador> findJugadoresLibresPorRolYLiga(String rol, Long ligaId);
}