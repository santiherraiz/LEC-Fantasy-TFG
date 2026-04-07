package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.config.JwtUtils;
import com.lecfantasy.backend.dto.AuthResponse;
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

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // Validamos al usuario
        Usuario usuario = usuarioService.login(request.getEmail(), request.getPassword());
        
        // Generamos su token JWT
        String token = jwtUtils.generateToken(usuario.getEmail());
        
        // Devolvemos el token + los datos del usuario
        return ResponseEntity.ok(new AuthResponse(token, usuario));
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
