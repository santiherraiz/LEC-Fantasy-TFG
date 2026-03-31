package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.repository.UsuarioRepository;
import com.lecfantasy.backend.service.JugadorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios") // Todas las rutas de esta clase empezarán por aquí
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JugadorService jugadorService;

    // POST http://localhost:8080/api/usuarios/registro
    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarUsuario(@RequestBody Usuario nuevoUsuario) {

        // ¡IMPORTANTE! Para el MVP lo guardamos en texto plano, pero aquí
        // en el futuro deberíamos encriptar la contraseña (ej. usando BCrypt).

        try {
            Usuario usuarioGuardado = usuarioRepository.save(nuevoUsuario);
            return ResponseEntity.ok(usuarioGuardado);
        } catch (Exception e) {
            // Si el email o nickname ya existen, MariaDB se quejará y saltará aquí
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/importar-jugadores")
    public ResponseEntity<String> forzarImportacion() {
        jugadorService.importarJugadoresDeLeaguepedia();
        return ResponseEntity.ok("Proceso de importación lanzado. Revisa la consola de Java.");
    }
}