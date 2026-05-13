package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Puja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PujaRepository extends JpaRepository<Puja, Long> {
    List<Puja> findBySubastaIdOrderByCantidadDescFechaPujaAsc(Long subastaId);

    Optional<Puja> findBySubastaIdAndUsuarioId(Long subastaId, Long usuarioId);
}
