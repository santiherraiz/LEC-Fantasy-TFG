package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.EquipoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    @Autowired
    private EquipoService equipoService;

    // Usamos {usuarioId} en la URL para saber de quién es el equipo
    @GetMapping("/mi-equipo/{usuarioId}")
    public ResponseEntity<?> obtenerMiEquipo(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(equipoService.obtenerDetalleEquipo(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}