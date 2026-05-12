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
    public ResponseEntity<?> obtenerMiEquipo(@PathVariable Long usuarioId, @RequestParam Long ligaId) {
        return ResponseEntity.ok(equipoService.obtenerDetalleEquipo(usuarioId, ligaId));
    }

    @PutMapping("/alinear")
    public ResponseEntity<String> gestionarAlineacion(@RequestBody AlinearRequest request) {
        String mensaje = mercadoService.cambiarEstadoAlineacion(request.getEquipoId(), request.getJugadorId());
        return ResponseEntity.ok(mensaje);
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<RankingDTO>> obtenerRanking(@RequestParam Long ligaId, @RequestParam(required = false) Long jornadaId) {
        return ResponseEntity.ok(equipoService.obtenerRanking(ligaId, jornadaId));
    }

    // Nuevo endpoint para ver el equipo de un rival
    @GetMapping("/rival/{equipoId}")
    public ResponseEntity<?> obtenerEquipoRival(@PathVariable Long equipoId) {
        return ResponseEntity.ok(equipoService.obtenerEquipoRival(equipoId));
    }

    @GetMapping("/{equipoId}/jornada/{jornadaId}")
    public ResponseEntity<?> obtenerEquipoJornada(@PathVariable Long equipoId, @PathVariable Long jornadaId) {
        return ResponseEntity.ok(equipoService.obtenerDetalleEquipoJornada(equipoId, jornadaId));
    }
}
