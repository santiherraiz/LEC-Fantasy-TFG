package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.config.JwtUtils;
import com.lecfantasy.backend.dto.AuthResponse;
import com.lecfantasy.backend.dto.LoginRequest;
import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.lecfantasy.backend.dto.MessageResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

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
    public ResponseEntity<MessageResponse> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        usuarioService.registrarNuevoUsuario(nuevoUsuario);
        return ResponseEntity.ok(new MessageResponse("Usuario registrado con éxito"));
    }

    @GetMapping("/perfil/{id}")
    public ResponseEntity<Usuario> obtenerPerfil(@PathVariable Long id) {
        Usuario usuario = usuarioService.obtenerPerfil(id);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/update-push-token")
    public ResponseEntity<MessageResponse> actualizarPushToken(@RequestParam Long usuarioId,
            @RequestParam String token) {
        usuarioService.actualizarPushToken(usuarioId, token);
        return ResponseEntity.ok(new MessageResponse("Token actualizado correctamente"));
    }
}
