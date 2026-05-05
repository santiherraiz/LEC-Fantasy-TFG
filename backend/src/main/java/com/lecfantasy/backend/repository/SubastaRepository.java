package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Subasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface SubastaRepository extends JpaRepository<Subasta, Long> {
    List<Subasta> findByLigaIdAndFinalizadaFalse(Long ligaId);
    List<Subasta> findByFinalizadaFalseAndFechaFinBefore(LocalDateTime now);
    boolean existsByLigaIdAndFinalizadaFalse(Long ligaId);
}
