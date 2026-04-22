package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.JornadaEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface JornadaRepository extends JpaRepository<Jornada, Long> {
    Optional<Jornada> findByNumeroSemana(Integer numeroSemana);
    List<Jornada> findAllByEstado(JornadaEstado estado);
    List<Jornada> findAllByEstadoNot(JornadaEstado estado);
}
