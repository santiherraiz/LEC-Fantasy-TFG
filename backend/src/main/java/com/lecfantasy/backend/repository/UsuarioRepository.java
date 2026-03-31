package com.lecfantasy.backend.repository;

import com.lecfantasy.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Más adelante, si necesitamos buscar a un usuario por su email para hacer login,
    // solo con escribir esta línea Spring sabrá cómo hacer la query:
    // Optional<Usuario> findByEmail(String email);
}