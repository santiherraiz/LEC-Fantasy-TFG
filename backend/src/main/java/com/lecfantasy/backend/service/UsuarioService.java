package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario registrarNuevoUsuario(Usuario nuevoUsuario) {
        // Se encripta la contraseña antes de guardar
        nuevoUsuario.setPassword(passwordEncoder.encode(nuevoUsuario.getPassword()));

        return usuarioRepository.save(nuevoUsuario);
    }

    @Transactional(readOnly = true)
    public Usuario login(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Email no registrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // Se comprueba la contraseña usando el encoder
        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta.");
        }

        return usuario;
    }

    @Transactional(readOnly = true)
    public Usuario obtenerPerfil(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

    @Transactional
    public void actualizarPushToken(Long usuarioId, String token) {
        Usuario usuario = obtenerPerfil(usuarioId);
        usuario.setPushToken(token);
        usuarioRepository.save(usuario);
    }
}
