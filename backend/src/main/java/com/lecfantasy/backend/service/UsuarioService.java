package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    // ¡Usamos @Transactional porque vamos a guardar en dos tablas distintas a la vez!
    @Transactional
    public Usuario registrarNuevoUsuario(Usuario nuevoUsuario) {

        // 1. Guardamos al usuario en la base de datos para que MariaDB le asigne un ID
        Usuario usuarioGuardado = usuarioRepository.save(nuevoUsuario);

        // 2. Fabricamos su equipo de bienvenida
        Equipo equipoInicial = new Equipo();
        // Le ponemos un nombre por defecto amigable
        equipoInicial.setNombreEquipo("Equipo de " + usuarioGuardado.getNickname());
        equipoInicial.setPresupuestoDisponible(50000.0); // Los 50k iniciales
        equipoInicial.setPuntuacionTotal(0.0);

        // 3. ¡Lo enlazamos! Le decimos que este equipo pertenece al usuario que acabamos de guardar
        equipoInicial.setUsuario(usuarioGuardado);

        // 4. Guardamos el equipo en la base de datos
        equipoRepository.save(equipoInicial);

        // Devolvemos el usuario para que el controlador pueda responder con él
        return usuarioGuardado;
    }
}