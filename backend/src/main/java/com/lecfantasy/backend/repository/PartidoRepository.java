package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, String> {

    List<Partido> findByJornada(Jornada jornada);

    List<Partido> findByJornadaNumeroSemana(Integer semana);

    List<Partido> findByJornadaAndPuntosCalculadosFalse(Jornada jornada);

    List<Partido> findByPuntosCalculadosFalse();

    List<Partido> findByEstadisticasImportadasFalse();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE Partido p SET p.puntosCalculados = false")
    void resetAllPuntosCalculados();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE Partido p SET p.estadisticasImportadas = false")
    void resetAllEstadisticasImportadas();
}
