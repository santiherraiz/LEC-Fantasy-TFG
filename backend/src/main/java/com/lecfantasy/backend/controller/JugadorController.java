package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.JugadorEstadisticaDTO;
import com.lecfantasy.backend.entity.Jugador;
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

    // Obtener los datos básicos de un jugador
    @GetMapping("/{id}")
    public ResponseEntity<Jugador> obtenerDetalleJugador(@PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.obtenerDetalleJugador(id));
    }

    // Obtener el historial de estadísticas de un jugador (puntos por partido)
    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<List<JugadorEstadisticaDTO>> obtenerEstadisticas(@PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.obtenerEstadisticasJugador(id));
    }
}
