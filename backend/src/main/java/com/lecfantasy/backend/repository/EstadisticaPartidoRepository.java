package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.EstadisticaPartido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstadisticaPartidoRepository extends JpaRepository<EstadisticaPartido, Long> {

    List<EstadisticaPartido> findByJugadorId(Long jugadorId);

    boolean existsByPartidoGameIdAndJugadorId(String gameId, Long jugadorId);
}