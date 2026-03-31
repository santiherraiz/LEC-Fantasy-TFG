package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.AlinearRequest;
import com.lecfantasy.backend.service.EquipoService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    @Autowired
    private EquipoService equipoService;

    @Autowired
    private MercadoService mercadoService; // Inyectamos el servicio para usar la lógica de alinear

    // Usamos {usuarioId} en la URL para saber de quién es el equipo
    @GetMapping("/mi-equipo/{usuarioId}")
    public ResponseEntity<?> obtenerMiEquipo(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(equipoService.obtenerDetalleEquipo(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/alinear")
    public ResponseEntity<String> gestionarAlineacion(@RequestBody AlinearRequest request) {
        try {
            String mensaje = mercadoService.cambiarEstadoAlineacion(request.getEquipoId(), request.getJugadorId());
            return ResponseEntity.ok(mensaje);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}