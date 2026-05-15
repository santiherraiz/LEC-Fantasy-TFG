package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.JugadorEstadisticaDTO;
import com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO;
import com.lecfantasy.backend.service.JugadorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
@Tag(name = "Jugadores", description = "Gestión de datos, estadísticas y rankings de los jugadores de la LEC")
public class JugadorController {

    @Autowired
    private JugadorService jugadorService;

    @Operation(summary = "Obtener ranking global", description = "Devuelve una lista de todos los jugadores ordenados por su puntuación acumulada total.")
    @GetMapping("/ranking")
    public ResponseEntity<List<JugadorPuntuacionTotalDTO>> obtenerRankingJugadores() {
        return ResponseEntity.ok(jugadorService.obtenerRankingJugadores());
    }

    @Operation(summary = "Obtener detalle de un jugador", description = "Recupera la ficha completa de un jugador. Si se proporciona ligaId, también indica quién es su dueño en esa liga específica.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Detalle del jugador encontrado"),
        @ApiResponse(responseCode = "404", description = "Jugador no encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerDetalleJugador(
            @Parameter(description = "ID único del jugador", example = "1") @PathVariable Long id,
            @Parameter(description = "ID de la liga para consultar el dueño (opcional)", example = "10") @RequestParam(required = false) Long ligaId) {
        return ResponseEntity.ok(jugadorService.obtenerDetalleJugador(id, ligaId));
    }

    @Operation(summary = "Obtener historial de estadísticas", description = "Devuelve el desglose de puntos obtenidos por el jugador en cada partido disputado.")
    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<List<JugadorEstadisticaDTO>> obtenerEstadisticas(
            @Parameter(description = "ID único del jugador", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.obtenerEstadisticasJugador(id));
    }
}
