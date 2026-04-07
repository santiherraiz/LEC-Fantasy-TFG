package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.repository.EquipoRepository;
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
    private EquipoRepository equipoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario registrarNuevoUsuario(Usuario nuevoUsuario) {
        // Encriptamos la contraseña antes de guardar
        nuevoUsuario.setPassword(passwordEncoder.encode(nuevoUsuario.getPassword()));

        Usuario usuarioGuardado = usuarioRepository.save(nuevoUsuario);

        Equipo equipoInicial = new Equipo();
        equipoInicial.setNombreEquipo("Equipo de " + usuarioGuardado.getNickname());
        equipoInicial.setPresupuestoDisponible(50000.0);
        equipoInicial.setPuntuacionTotal(0.0);
        equipoInicial.setUsuario(usuarioGuardado);

        equipoRepository.save(equipoInicial);

        return usuarioGuardado;
    }

    public Usuario login(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Email no registrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // Comprobamos la contraseña usando el encoder
        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta.");
        }

        return usuario;
    }

    public Usuario obtenerPerfil(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }
}
