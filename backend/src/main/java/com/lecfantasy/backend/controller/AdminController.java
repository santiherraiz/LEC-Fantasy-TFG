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

    @PostMapping("/puntuacion/snapshot/{semana}")
    public ResponseEntity<String> hacerSnapshot(@PathVariable int semana) {
        puntuacionService.hacerSnapshotSemana(semana);
        return ResponseEntity.ok("Snapshot de la semana " + semana + " realizado con éxito.");
    }

    @PostMapping("/puntuacion/calcular/{semana}")
    public ResponseEntity<String> calcularSemana(@PathVariable int semana) {
        String resultado = puntuacionService.calcularPuntosSemana(semana);
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

    @PostMapping("/debug/seed-semana-1")
    public ResponseEntity<String> seedSemana1() {
        String resultado = puntuacionService.crearDatosPruebaSemana1();
        return ResponseEntity.ok(resultado);
    }
}
