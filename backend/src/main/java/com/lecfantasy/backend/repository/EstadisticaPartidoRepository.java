package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.EstadisticaPartido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstadisticaPartidoRepository extends JpaRepository<EstadisticaPartido, Long> {

    List<EstadisticaPartido> findByJugadorId(Long jugadorId);

    List<EstadisticaPartido> findByPartidoSemana(Integer semana);

    List<EstadisticaPartido> findByPartidoGameId(String gameId);

    boolean existsByPartidoGameIdAndJugadorId(String gameId, Long jugadorId);

    boolean existsByPartidoGameId(String gameId);
    }