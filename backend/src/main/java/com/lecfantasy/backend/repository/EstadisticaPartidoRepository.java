package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.EstadisticaPartido;
import com.lecfantasy.backend.entity.Jornada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstadisticaPartidoRepository extends JpaRepository<EstadisticaPartido, Long> {

    @Query("SELECT MAX(ep.partido.jornada.numeroSemana) FROM EstadisticaPartido ep")
    Integer findMaxSemanaConStats();

    @Query("SELECT ep FROM EstadisticaPartido ep " +
           "JOIN FETCH ep.partido p " +
           "LEFT JOIN FETCH p.team1Entity " +
           "LEFT JOIN FETCH p.team2Entity " +
           "WHERE ep.jugador.id = :jugadorId")
    List<EstadisticaPartido> findByJugadorId(Long jugadorId);

    @Query("SELECT COALESCE(SUM(ep.puntosGenerados), 0.0) FROM EstadisticaPartido ep WHERE ep.jugador.id = :jugadorId")
    Double sumPuntosByJugadorId(Long jugadorId);

    List<EstadisticaPartido> findByPartidoJornada(Jornada jornada);

    List<EstadisticaPartido> findByPartidoJornadaNumeroSemana(Integer semana);

    List<EstadisticaPartido> findByPartidoGameId(String gameId);

    List<EstadisticaPartido> findByPartidoSerieId(String serieId);

    boolean existsByPartidoGameIdAndJugadorId(String gameId, Long jugadorId);

    boolean existsByPartidoGameId(String gameId);
}
