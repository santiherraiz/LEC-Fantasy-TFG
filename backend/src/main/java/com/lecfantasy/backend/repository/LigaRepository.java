package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Liga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LigaRepository extends JpaRepository<Liga, Long> {
    Optional<Liga> findByCodigoAcceso(String codigoAcceso);

    @Query("SELECT l FROM Liga l JOIN Equipo e ON e.liga.id = l.id WHERE e.usuario.id = :usuarioId")
    List<Liga> findLigasByUsuarioId(Long usuarioId);
}
