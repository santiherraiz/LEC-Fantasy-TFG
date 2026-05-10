package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.PuntuacionService;
import com.lecfantasy.backend.service.JornadaService;
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

    @Autowired
    private JornadaService jornadaService;

    @Autowired
    private com.lecfantasy.backend.service.MercadoService mercadoService;

    @PostMapping("/mercado/refrescar")
    public ResponseEntity<String> refrescarMercado() {
        mercadoService.forzarRefrescoMercado();
        return ResponseEntity.ok("Mercado refrescado manualmente: subastas resueltas y nuevos jugadores generados.");
    }

    @PostMapping("/jornadas/sincronizar")
    public ResponseEntity<String> sincronizarCalendario() {
        jornadaService.sincronizarCalendario();
        return ResponseEntity.ok("Calendario de jornadas sincronizado con Leaguepedia.");
    }

    @PostMapping("/puntuacion/snapshot/{semana}")
    public ResponseEntity<String> hacerSnapshot(@PathVariable int semana) {
        puntuacionService.hacerSnapshotSemana(semana);
        return ResponseEntity.ok("Snapshot de la semana " + semana + " realizado con éxito.");
    }

    @PostMapping("/calcular-puntos")
    public ResponseEntity<String> calcularPuntos() {
        String resultado = puntuacionService.calcularPuntos();
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

    @PostMapping("/importar-estadisticas")
    public ResponseEntity<String> importarEstadisticas() {
        puntuacionService.importarEstadisticasDeLeaguepedia();
        return ResponseEntity
                .ok("Proceso de importación (lote de 10) lanzado en segundo plano. Revisa los logs del servidor.");
    }

    @PostMapping("/reset-importaciones")
    public ResponseEntity<String> resetImportaciones() {
        puntuacionService.resetImportaciones();
        return ResponseEntity.ok("Columna estadisticas_importadas reseteada a 0 para todos los partidos.");
    }

    @PostMapping("/reset-calculos")
    public ResponseEntity<String> resetCalculos() {
        puntuacionService.resetCalculos();
        return ResponseEntity.ok("Columna puntos_calculados reseteada a 0 para todos los partidos.");
    }

    @PostMapping("/reset-total")
    public ResponseEntity<String> resetTotal() {
        puntuacionService.resetTotal();
        return ResponseEntity.ok("LIMPIEZA TOTAL: Estadísticas borradas, importaciones y cálculos reseteados.");
    }
}
