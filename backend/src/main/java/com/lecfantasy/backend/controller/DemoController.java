package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import com.lecfantasy.backend.service.ClockService;
import com.lecfantasy.backend.service.PuntuacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    @Autowired
    private ClockService clockService;
    @Autowired
    private JornadaRepository jornadaRepository;
    @Autowired
    private PartidoRepository partidoRepository;
    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private HistoricoAlineacionRepository historicoAlineacionRepository;
    @Autowired
    private PuntuacionService puntuacionService;

    @PostMapping("/activar")
    public ResponseEntity<String> activarDemo() {
        // Fecha de inicio: Viernes tarde antes de los partidos
        LocalDateTime inicio = LocalDateTime.of(2026, 6, 1, 16, 0);
        clockService.activarModoDemo(inicio);

        // Crear Jornada de Demo
        Jornada j = new Jornada();
        j.setNumeroSemana(99);
        j.setFechaInicio(inicio.plusHours(2)); // Empieza a las 18:00
        j.setFechaFin(inicio.plusDays(2).plusHours(4)); // Termina el domingo noche
        j.setEstado(JornadaEstado.PROGRAMADA);
        jornadaRepository.save(j);

        return ResponseEntity.ok("🎮 Modo Demo ACTIVADO. Fecha virtual: " + inicio + ". Jornada 99 creada.");
    }

    @PostMapping("/avanzar-bloqueo")
    public ResponseEntity<String> avanzarBloqueo() {
        // Adelantamos a 10 min antes del inicio (17:50)
        LocalDateTime tiempo = LocalDateTime.of(2026, 6, 1, 17, 50);
        clockService.establecerFechaSimulada(tiempo);
        return ResponseEntity
                .ok("⏰ Tiempo avanzado a: " + tiempo + ". El Scheduler debería bloquear la jornada en 1 min.");
    }

    @PostMapping("/avanzar-fin")
    public ResponseEntity<String> avanzarFin() {
        // Adelantamos al lunes por la mañana
        LocalDateTime tiempo = LocalDateTime.of(2026, 6, 4, 10, 0);
        clockService.establecerFechaSimulada(tiempo);
        return ResponseEntity.ok("⏰ Tiempo avanzado a: " + tiempo + ". La jornada ya ha terminado cronológicamente.");
    }

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private com.lecfantasy.backend.service.MercadoService mercadoService;

    @PostMapping("/avanzar-mercado")
    public ResponseEntity<String> avanzarMercado() {
        if (!clockService.isModoDemoActivo()) {
            return ResponseEntity.status(403).body("❌ El avance manual del mercado solo está permitido en Modo Demo.");
        }
        // 1. Adelantamos 24 horas el reloj simulado
        LocalDateTime tiempoAnterior = clockService.ahora();
        LocalDateTime nuevoTiempo = tiempoAnterior.plusDays(1);
        clockService.establecerFechaSimulada(nuevoTiempo);
        
        // 2. BUSCAMOS las subastas que estaban activas y las "caducamos" 
        // poniéndoles una fecha de fin justo antes del nuevo tiempo.
        // Esto asegura que 'resolverSubastasExpiradas' las vea como caducadas.
        List<Subasta> activas = subastaRepository.findByFinalizadaFalse();
        for (Subasta s : activas) {
            if (s.getFechaFin().isBefore(nuevoTiempo)) {
                s.setFechaFin(nuevoTiempo.minusMinutes(1));
                subastaRepository.save(s);
            }
        }
        
        // 3. Forzamos el procesamiento: Esto resolverá las que acabamos de caducar
        // y generará las nuevas para el día siguiente.
        mercadoService.forzarRefrescoMercado();
        
        return ResponseEntity.ok("⏰ Mercado avanzado de " + tiempoAnterior + " a " + nuevoTiempo + ". Subastas procesadas y nuevas generadas.");
    }

    @PostMapping("/forzar-snapshot")
    public ResponseEntity<String> forzarSnapshot() {
        Jornada j = jornadaRepository.findByNumeroSemana(99).orElseThrow();
        puntuacionService.hacerSnapshotSemana(99);
        j.setEstado(JornadaEstado.BLOQUEADA);
        jornadaRepository.save(j);
        return ResponseEntity.ok("📸 [DEMO] Mercado CERRADO. Alineaciones congeladas para la Semana 99.");
    }

    @PostMapping("/forzar-calculo")
    public ResponseEntity<String> forzarCalculo() {
        String resultado = puntuacionService.calcularPuntos();
        return ResponseEntity.ok("⚙️ [DEMO] Cálculo ejecutado: " + resultado);
    }

    @PostMapping("/inyectar-stats")
    public ResponseEntity<String> inyectarStats() {
        Jornada j = jornadaRepository.findByNumeroSemana(99).orElseThrow();

        // 1. Obtener rosters de la DB
        List<Jugador> g2Players = jugadorRepository.findAll().stream()
                .filter(jug -> jug.getEquipoLec() != null && jug.getEquipoLec().getNombre().contains("G2"))
                .collect(java.util.stream.Collectors.toList());

        List<Jugador> mkoiPlayers = jugadorRepository.findAll().stream()
                .filter(jug -> jug.getEquipoLec() != null && (jug.getEquipoLec().getNombre().contains("MAD")
                        || jug.getEquipoLec().getNombre().contains("KOI")))
                .collect(java.util.stream.Collectors.toList());

        if (g2Players.isEmpty() || mkoiPlayers.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("❌ Error: No se han encontrado jugadores de G2 o MKOI en la base de datos.");
        }

        String serieId = "DEMO_SERIE_G2_MKOI";

        // --- MAPA 1: VICTORIA G2 ---
        Partido p1 = new Partido();
        p1.setGameId(serieId + "_1");
        p1.setSerieId(serieId);
        p1.setTeam1("G2 Esports");
        p1.setTeam2("MAD Lions KOI");
        p1.setWinTeam("G2 Esports");
        p1.setLossTeam("MAD Lions KOI");
        p1.setJornada(j);
        p1.setEstadisticasImportadas(true);
        p1.setPuntosCalculados(false);
        partidoRepository.save(p1);

        inyectarRosterStats(p1, g2Players, true); // G2 buenos stats
        inyectarRosterStats(p1, mkoiPlayers, false); // MKOI malos stats

        // --- MAPA 2: VICTORIA MKOI ---
        Partido p2 = new Partido();
        p2.setGameId(serieId + "_2");
        p2.setSerieId(serieId);
        p2.setTeam1("G2 Esports");
        p2.setTeam2("MAD Lions KOI");
        p2.setWinTeam("MAD Lions KOI");
        p2.setLossTeam("G2 Esports");
        p2.setJornada(j);
        p2.setEstadisticasImportadas(true);
        p2.setPuntosCalculados(false);
        partidoRepository.save(p2);

        inyectarRosterStats(p2, g2Players, false); // G2 malos stats
        inyectarRosterStats(p2, mkoiPlayers, true); // MKOI buenos stats

        return ResponseEntity.ok("🔥 Serie G2 vs MKOI inyectada (2 Mapas, 10 Jugadores). ¡Listo para calcular!");
    }

    private void inyectarRosterStats(Partido p, List<Jugador> roster, boolean isWinner) {
        for (Jugador jug : roster) {
            EstadisticaPartido ep = new EstadisticaPartido();
            ep.setPartido(p);
            ep.setJugador(jug);
            if (isWinner) {
                ep.setKills(8);
                ep.setDeaths(1);
                ep.setAssists(12);
                ep.setCs(280);
                ep.setGold(14000);
            } else {
                ep.setKills(2);
                ep.setDeaths(7);
                ep.setAssists(4);
                ep.setCs(210);
                ep.setGold(9500);
            }
            ep.setPuntosGenerados(0.0);
            estadisticaPartidoRepository.save(ep);
        }
    }

    @PostMapping("/desactivar")
    public ResponseEntity<String> desactivarDemo() {
        clockService.desactivarModoDemo();

        // Limpieza de datos de prueba
        Optional<Jornada> j99 = jornadaRepository.findByNumeroSemana(99);
        j99.ifPresent(j -> {
            // 1. Borrar históricos de alineación de la jornada 99 (IMPORTANTE: Primero esto
            // para evitar error FK)
            historicoAlineacionRepository.findByJornada(j).forEach(h -> {
                historicoAlineacionRepository.delete(h);
            });

            // 2. Borrar estadísticas de partidos de la jornada 99
            estadisticaPartidoRepository.findByPartidoJornada(j).forEach(stats -> {
                estadisticaPartidoRepository.delete(stats);
            });
            // 3. Borrar partidos de la jornada 99
            partidoRepository.findByJornada(j).forEach(p -> {
                partidoRepository.delete(p);
            });
            // 4. Borrar la jornada 99
            jornadaRepository.delete(j);
        });

        // NUEVO: Al desactivar el modo demo, forzamos un refresco del mercado
        // para que las subastas que estaban en "2026" se cancelen y se generen
        // unas nuevas basadas en la hora REAL actual.
        try {
            List<Subasta> subastasDemo = subastaRepository.findByFinalizadaFalse();
            for (Subasta s : subastasDemo) {
                s.setFinalizada(true);
                subastaRepository.save(s);
            }
            mercadoService.forzarRefrescoMercado();
        } catch (Exception e) {
            // Loguear error pero permitir que el endpoint termine
        }

        return ResponseEntity.ok(
                "🛑 Modo Demo desactivado. Datos de la Semana 99 eliminados y mercado reseteado a hora real.");
    }
}
