package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Nos sirve para buscar un usuario por su email para hacer login
    Optional<Usuario> findByEmail(String email);
}