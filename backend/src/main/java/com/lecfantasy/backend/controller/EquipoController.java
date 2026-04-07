package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.AlinearRequest;
import com.lecfantasy.backend.dto.RankingDTO;
import com.lecfantasy.backend.service.EquipoService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return ResponseEntity.ok(equipoService.obtenerDetalleEquipo(usuarioId));
    }

    @PutMapping("/alinear")
    public ResponseEntity<String> gestionarAlineacion(@RequestBody AlinearRequest request) {
        String mensaje = mercadoService.cambiarEstadoAlineacion(request.getEquipoId(), request.getJugadorId());
        return ResponseEntity.ok(mensaje);
    }

    // Devuelve el ranking de todos los equipos ordenados por puntos (descendente)
    @GetMapping("/ranking")
    public ResponseEntity<List<RankingDTO>> obtenerRanking() {
        return ResponseEntity.ok(equipoService.obtenerRanking());
    }
}
