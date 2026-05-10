package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.NoticiaLiga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticiaLigaRepository extends JpaRepository<NoticiaLiga, Long> {
    Page<NoticiaLiga> findByLigaIdOrderByFechaDesc(Long ligaId, Pageable pageable);
}
