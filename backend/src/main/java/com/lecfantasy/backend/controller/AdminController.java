package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO;
import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO.PartidoData;
import com.lecfantasy.backend.service.PuntuacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PuntuacionService puntuacionService;

    // El endpoint para buscar la lista de partidos de un torneo (GET)
    @GetMapping("/partidos")
    public ResponseEntity<List<PartidoData>> obtenerPartidosPorTorneo(@RequestParam String torneo) {
        try {
            return ResponseEntity.ok(puntuacionService.obtenerPartidosPorTorneo(torneo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/procesar-partido")
    public ResponseEntity<String> procesarPartido(@RequestParam String gameId) {
        puntuacionService.procesarJornadaLeaguepedia(gameId);
        return ResponseEntity.ok("Puntos procesados correctamente para el partido: " + gameId);
    }
}