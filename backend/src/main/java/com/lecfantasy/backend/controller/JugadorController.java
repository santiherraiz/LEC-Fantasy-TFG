package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.JugadorEstadisticaDTO;
import com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO;
import com.lecfantasy.backend.service.JugadorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
public class JugadorController {

    @Autowired
    private JugadorService jugadorService;

    // Obtener el ranking global de jugadores por puntos
    @GetMapping("/ranking")
    public ResponseEntity<List<JugadorPuntuacionTotalDTO>> obtenerRankingJugadores() {
        return ResponseEntity.ok(jugadorService.obtenerRankingJugadores());
    }

    // Obtener los datos básicos de un jugador (opcionalmente con dueño si se pasa ligaId)
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerDetalleJugador(
            @PathVariable Long id,
            @RequestParam(required = false) Long ligaId) {
        if (ligaId != null) {
            return ResponseEntity.ok(jugadorService.obtenerDetalleJugadorConPropietario(id, ligaId));
        }
        return ResponseEntity.ok(jugadorService.obtenerDetalleJugador(id));
    }

    // Obtener el historial de estadísticas de un jugador (puntos por partido)
    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<List<JugadorEstadisticaDTO>> obtenerEstadisticas(@PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.obtenerEstadisticasJugador(id));
    }
}
