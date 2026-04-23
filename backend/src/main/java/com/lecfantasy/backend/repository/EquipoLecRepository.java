package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.EquipoLec;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EquipoLecRepository extends JpaRepository<EquipoLec, Long> {
    Optional<EquipoLec> findByNombre(String nombre);
}
