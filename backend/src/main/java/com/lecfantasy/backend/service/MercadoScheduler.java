package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.repository.LigaRepository;
import com.lecfantasy.backend.repository.SubastaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.PartidoRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MercadoScheduler {

    @Autowired
    private MercadoService mercadoService;

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private PuntuacionService puntuacionService;

    // Se ejecuta cada día a las 04:00 AM
    @Scheduled(cron = "0 0 4 * * ?")
    @Transactional
    public void recalcularPreciosDiarios() {
        System.out.println("📈 [MERCADO] Iniciando motor de fluctuación (FASE 2 & 3)...");

        List<Jugador> todosLosJugadores = jugadorRepository.findAll();
        int semanaActual = puntuacionService.obtenerSemanaActual();

        // 1. Calcular media de puntos de todos los jugadores en la jornada actual
        double mediaPuntosGlobal = obtenerMediaPuntosJornada(semanaActual);
        System.out.println("📊 [MERCADO] Media de puntos en semana " + semanaActual + ": " + mediaPuntosGlobal);

        for (Jugador jugador : todosLosJugadores) {
            try {
                double precioActual = jugador.getPrecioActual() != null ? jugador.getPrecioActual()
                        : jugador.getPrecioBase();
                double variacionFinal = 0;

                // --- FACTOR 1: Rendimiento Relativo (60%) ---
                double puntosJugador = obtenerPuntosJugadorSemana(jugador.getId(), semanaActual);
                double diferenciaPuntos = puntosJugador - mediaPuntosGlobal;

                // Un punto por encima/debajo de la media equivale a un ~0.5% de variación base
                // Si la media es baja y puntúa alto, el impacto es mayor
                double impactoRendimiento = (diferenciaPuntos * 0.005) * 0.60;
                variacionFinal += impactoRendimiento;

                // --- FACTOR 2: Factor Calendario (25%) ---
                long numSeriesProximaSemana = contarSeriesEquipoSemana(jugador.getEquipoLec().getId(),
                        semanaActual + 1);
                double impactoCalendario = 0;
                if (numSeriesProximaSemana >= 2) {
                    impactoCalendario = 0.02 * 0.25; // +2% diario ponderado
                } else if (numSeriesProximaSemana == 0) {
                    impactoCalendario = -0.01 * 0.25; // Freno al crecimiento
                }
                variacionFinal += impactoCalendario;

                // --- FACTOR 3: Oferta y Demanda (15%) ---
                int compras = jugador.getComprasHoy() != null ? jugador.getComprasHoy() : 0;
                double impactoDemanda = (compras * 0.01) * 0.15; // +1% por compra ponderado al 15%
                variacionFinal += impactoDemanda;

                // --- CASTIGO POR INACTIVIDAD ---
                boolean suEquipoHaJugadoYa = equipoLecHaJugadoEnSemana(jugador.getEquipoLec().getId(), semanaActual);
                boolean haJugado = haJugadoAlgunaVezEnSemana(jugador.getId(), semanaActual);

                if (suEquipoHaJugadoYa && !haJugado) {
                    variacionFinal -= 0.04; // Caída del 4% (entre 3% y 5%)
                }

                // --- APLICACIÓN Y MUROS DE SEGURIDAD (FASE 3) ---
                // 1. El Tope Diario (+/- 5%)
                if (variacionFinal > 0.05)
                    variacionFinal = 0.05;
                if (variacionFinal < -0.05)
                    variacionFinal = -0.05;

                double nuevoPrecio = precioActual * (1 + variacionFinal);

                // 2. El Suelo de Cristal (1.000 €)
                if (nuevoPrecio < 1000.0)
                    nuevoPrecio = 1000.0;

                // Actualizar tendencia para la UI
                if (nuevoPrecio > precioActual * 1.001) {
                    jugador.setTendencia("SUBE");
                } else if (nuevoPrecio < precioActual * 0.999) {
                    jugador.setTendencia("BAJA");
                } else {
                    jugador.setTendencia("ESTABLE");
                }

                jugador.setPrecioActual(Math.round(nuevoPrecio) * 1.0);

                // Resetear contadores diarios
                jugador.setComprasHoy(0);
                jugador.setVentasHoy(0);

                jugadorRepository.save(jugador);

            } catch (Exception e) {
                System.err.println("Error en motor económico para " + jugador.getNickname() + ": " + e.getMessage());
            }
        }
        System.out.println("✅ [MERCADO] Recalibración económica completada.");
    }

    private double obtenerMediaPuntosJornada(int semana) {
        return estadisticaPartidoRepository.findAll().stream()
                .filter(s -> s.getPartido().getJornada() != null
                        && s.getPartido().getJornada().getNumeroSemana() == semana)
                .mapToDouble(com.lecfantasy.backend.entity.EstadisticaPartido::getPuntosGenerados)
                .average().orElse(0.0);
    }

    private double obtenerPuntosJugadorSemana(Long jugadorId, int semana) {
        return estadisticaPartidoRepository.findByJugadorId(jugadorId).stream()
                .filter(s -> s.getPartido().getJornada() != null
                        && s.getPartido().getJornada().getNumeroSemana() == semana)
                .mapToDouble(com.lecfantasy.backend.entity.EstadisticaPartido::getPuntosGenerados)
                .sum();
    }

    private boolean haJugadoAlgunaVezEnSemana(Long jugadorId, int semana) {
        return estadisticaPartidoRepository.findByJugadorId(jugadorId).stream()
                .anyMatch(s -> s.getPartido().getJornada() != null
                        && s.getPartido().getJornada().getNumeroSemana() == semana);
    }

    private boolean equipoLecHaJugadoEnSemana(Long equipoLecId, int semana) {
        return estadisticaPartidoRepository.findAll().stream()
                .anyMatch(s -> s.getPartido().getJornada() != null &&
                        s.getPartido().getJornada().getNumeroSemana() == semana &&
                        s.getPartido().isEstadisticasImportadas() &&
                        ((s.getPartido().getTeam1Entity() != null
                                && s.getPartido().getTeam1Entity().getId().equals(equipoLecId)) ||
                                (s.getPartido().getTeam2Entity() != null
                                        && s.getPartido().getTeam2Entity().getId().equals(equipoLecId))));
    }

    private long contarSeriesEquipoSemana(Long equipoLecId, int semana) {
        return partidoRepository.findAll().stream()
                .filter(p -> p.getJornada() != null && p.getJornada().getNumeroSemana() == semana)
                .filter(p -> (p.getTeam1Entity() != null && p.getTeam1Entity().getId().equals(equipoLecId)) ||
                        (p.getTeam2Entity() != null && p.getTeam2Entity().getId().equals(equipoLecId)))
                .map(com.lecfantasy.backend.entity.Partido::getSerieId)
                .distinct()
                .count();
    }

    // Se ejecuta cada minuto
    @Scheduled(fixedRate = 60000)
    public void gestionarMercado() {
        try {
            // 1. Resolver subastas que ya hayan expirado
            mercadoService.resolverSubastasExpiradas();

            // 2. Comprobar si alguna liga necesita nuevos jugadores
            List<Liga> todasLasLigas = ligaRepository.findAll();

            for (Liga liga : todasLasLigas) {
                try {
                    boolean tieneSubastasActivas = subastaRepository.existsByLigaIdAndFinalizadaFalse(liga.getId());

                    if (!tieneSubastasActivas) {
                        System.out.println("Programando nuevas subastas para la liga: " + liga.getNombre());
                        mercadoService.initMercadoParaLiga(liga);
                    }
                } catch (Exception e) {
                    System.err.println("Error procesando mercado para liga " + liga.getId() + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error crítico en MercadoScheduler: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
