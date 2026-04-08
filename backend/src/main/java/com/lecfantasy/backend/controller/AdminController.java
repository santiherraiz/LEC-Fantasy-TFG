package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.PuntuacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PuntuacionService puntuacionService;

    @Autowired
    private JugadorService jugadorService;

    @PostMapping("/procesar-pendientes")
    public ResponseEntity<String> procesarPartidosPendientes() {
        String resultado = puntuacionService.procesarPartidosPendientes();
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/importar-partidos")
    public ResponseEntity<String> importarPartidos() {
        puntuacionService.importarPartidosDeLeaguepedia();
        return ResponseEntity.ok("Importación de partidos completada. Revisa la consola.");
    }

    @PostMapping("/importar-jugadores")
    public ResponseEntity<String> forzarImportacion() {
        jugadorService.importarJugadoresDeLeaguepedia();
        return ResponseEntity.ok("Proceso de importación de jugadores lanzado. Revisa la consola.");
    }
}
