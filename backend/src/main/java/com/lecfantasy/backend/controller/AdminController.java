package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.PuntuacionService;
import com.lecfantasy.backend.dto.MessageResponse;
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
    public ResponseEntity<MessageResponse> refrescarMercado() {
        mercadoService.forzarRefrescoMercado();
        return ResponseEntity.ok(new MessageResponse("Mercado refrescado manualmente: subastas resueltas y nuevos jugadores generados."));
    }

    @PostMapping("/jornadas/sincronizar")
    public ResponseEntity<MessageResponse> sincronizarCalendario() {
        jornadaService.sincronizarCalendario();
        return ResponseEntity.ok(new MessageResponse("Calendario de jornadas sincronizado con Leaguepedia."));
    }

    @PostMapping("/puntuacion/snapshot/{semana}")
    public ResponseEntity<MessageResponse> hacerSnapshot(@PathVariable int semana) {
        puntuacionService.hacerSnapshotSemana(semana);
        return ResponseEntity.ok(new MessageResponse("Snapshot de la semana " + semana + " realizado con éxito."));
    }

    @PostMapping("/calcular-puntos")
    public ResponseEntity<MessageResponse> calcularPuntos() {
        String resultado = puntuacionService.calcularPuntos();
        return ResponseEntity.ok(new MessageResponse(resultado));
    }

    @PostMapping("/importar-partidos")
    public ResponseEntity<MessageResponse> importarPartidos() {
        puntuacionService.importarPartidosDeLeaguepedia();
        return ResponseEntity.ok(new MessageResponse("Importación de partidos completada. Revisa la consola."));
    }

    @PostMapping("/importar-jugadores")
    public ResponseEntity<MessageResponse> forzarImportacion() {
        jugadorService.importarJugadoresDeLeaguepedia();
        return ResponseEntity.ok(new MessageResponse("Proceso de importación de jugadores lanzado. Revisa la consola."));
    }

    @PostMapping("/importar-estadisticas")
    public ResponseEntity<MessageResponse> importarEstadisticas() {
        puntuacionService.importarEstadisticasDeLeaguepedia();
        return ResponseEntity
                .ok(new MessageResponse("Proceso de importación (lote de 10) lanzado en segundo plano. Revisa los logs del servidor."));
    }

    @PostMapping("/reset-importaciones")
    public ResponseEntity<MessageResponse> resetImportaciones() {
        puntuacionService.resetImportaciones();
        return ResponseEntity.ok(new MessageResponse("Columna estadisticas_importadas reseteada a 0 para todos los partidos."));
    }

    @PostMapping("/reset-calculos")
    public ResponseEntity<MessageResponse> resetCalculos() {
        puntuacionService.resetCalculos();
        return ResponseEntity.ok(new MessageResponse("Columna puntos_calculados reseteada a 0 para todos los partidos."));
    }

    @PostMapping("/reset-total")
    public ResponseEntity<MessageResponse> resetTotal() {
        puntuacionService.resetTotal();
        return ResponseEntity.ok(new MessageResponse("LIMPIEZA TOTAL: Estadísticas borradas, importaciones y cálculos reseteados."));
    }
}
