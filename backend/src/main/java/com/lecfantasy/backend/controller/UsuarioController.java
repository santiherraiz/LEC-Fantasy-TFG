package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.LoginRequest;
import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JugadorService jugadorService;

    @PostMapping("/login")
    public ResponseEntity<Usuario> login(@RequestBody LoginRequest request) {
        // La excepción ahora la maneja el GlobalExceptionHandler automáticamente
        Usuario usuario = usuarioService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        Usuario usuarioGuardado = usuarioService.registrarNuevoUsuario(nuevoUsuario);
        return ResponseEntity.ok(usuarioGuardado);
    }

    @GetMapping("/perfil/{id}")
    public ResponseEntity<Usuario> obtenerPerfil(@PathVariable Long id) {
        Usuario usuario = usuarioService.obtenerPerfil(id);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/importar-jugadores")
    public ResponseEntity<String> forzarImportacion() {
        jugadorService.importarJugadoresDeLeaguepedia();
        return ResponseEntity.ok("Proceso de importación lanzado. Revisa la consola de Java.");
    }
}
