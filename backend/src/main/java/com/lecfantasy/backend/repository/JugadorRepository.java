package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    // Este método nos servirá para comprobar si un jugador ya existe en nuestra BD
    // buscando por su nickname (ej. "Caps") antes de guardarlo duplicado.
    Optional<Jugador> findByNickname(String nickname);
}