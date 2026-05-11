package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.repository.LigaRepository;
import com.lecfantasy.backend.repository.SubastaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.JornadaRepository;
import com.lecfantasy.backend.repository.PartidoRepository;

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
    private JornadaRepository jornadaRepository;

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private ClockService clockService;

    // Se ejecuta cada día a las 04:00 AM
    @Scheduled(cron = "0 0 4 * * ?")
    @org.springframework.transaction.annotation.Transactional
    public void recalcularPreciosDiarios() {
        System.out.println("📈 [MERCADO] Iniciando recalibración de precios diarios (ALTA VOLATILIDAD)...");

        List<Jugador> todosLosJugadores = jugadorRepository.findAll();

        // Obtener las próximas jornadas activas para el factor Look-Ahead
        List<Jornada> proximasJornadas = jornadaRepository
                .findAllByEstadoNot(com.lecfantasy.backend.entity.JornadaEstado.FINALIZADA)
                .stream()
                .sorted((j1, j2) -> j1.getNumeroSemana().compareTo(j2.getNumeroSemana()))
                .limit(2) // Miramos esta semana y la que viene
                .collect(java.util.stream.Collectors.toList());

        for (Jugador jugador : todosLosJugadores) {
            try {
                double precioAnterior = jugador.getPrecioActual() != null ? jugador.getPrecioActual()
                        : jugador.getPrecioBase();

                // --- PILAR 1: Valor Fundamental (Rendimiento Histórico) ---
                List<com.lecfantasy.backend.entity.EstadisticaPartido> stats = estadisticaPartidoRepository
                        .findByJugadorId(jugador.getId());
                double totalPuntos = stats.stream()
                        .mapToDouble(com.lecfantasy.backend.entity.EstadisticaPartido::getPuntosGenerados).sum();
                long numSeries = stats.stream().map(s -> s.getPartido().getSerieId()).distinct().count();

                double mediaPuntos = numSeries == 0 ? 0.0 : totalPuntos / numSeries;
                double precioIdeal = mediaPuntos * 1000.0;

                // AJUSTE AGRESIVO: Mover el precio un 15% hacia el precio ideal
                double ajusteFundamental = (precioIdeal - precioAnterior) * 0.15;
                double nuevoPrecio = precioAnterior + ajusteFundamental;

                // --- PILAR 2: Factor Calendario (Context & Look-Ahead Aware) ---
                double multiplicadorCalendarioTotal = 1.0;

                for (int i = 0; i < proximasJornadas.size(); i++) {
                    Jornada j = proximasJornadas.get(i);
                    long numPartidos = partidoRepository.findByJornada(j).stream()
                            .filter(p -> (p.getTeam1Entity() != null
                                    && p.getTeam1Entity().getId().equals(jugador.getEquipoLec().getId())) ||
                                    (p.getTeam2Entity() != null
                                            && p.getTeam2Entity().getId().equals(jugador.getEquipoLec().getId())))
                            .count();

                    double multEstaJornada = 1.0;
                    if (numPartidos == 0)
                        multEstaJornada = 0.85; // -15%
                    else if (numPartidos == 1)
                        multEstaJornada = 1.05; // +5%
                    else if (numPartidos == 2)
                        multEstaJornada = 1.15; // +15%
                    else if (numPartidos >= 3)
                        multEstaJornada = 1.25; // +25%

                    // Si es la semana que viene, el impacto es la mitad (Ponderación por lejanía)
                    if (i == 1) {
                        multEstaJornada = 1.0 + ((multEstaJornada - 1.0) * 0.5);
                    }

                    multiplicadorCalendarioTotal *= multEstaJornada;
                }

                nuevoPrecio *= multiplicadorCalendarioTotal;

                // --- PILAR 3: Mercado Real (Usuarios) ---
                // AJUSTE AGRESIVO: 2.000€ por cada compra/venta
                nuevoPrecio += (jugador.getComprasHoy() != null ? jugador.getComprasHoy() : 0) * 2000.0;
                nuevoPrecio -= (jugador.getVentasHoy() != null ? jugador.getVentasHoy() : 0) * 2000.0;

                // Restricciones: Suelo 1.000€ y Techo 100.000€
                if (nuevoPrecio < 1000.0)
                    nuevoPrecio = 1000.0;
                if (nuevoPrecio > 100000.0)
                    nuevoPrecio = 100000.0;

                // Actualizar tendencia
                if (nuevoPrecio > precioAnterior + 10) { // Margen de 10€ para evitar fluctuaciones por redondeo
                    jugador.setTendencia("SUBE");
                } else if (nuevoPrecio < precioAnterior - 10) {
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
                System.err.println("Error recalibrando precio para " + jugador.getNickname() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("✅ [MERCADO] Recalibración agresiva completada.");
    }

    // Se ejecuta cada minuto
    @Scheduled(fixedRate = 60000)
    public void gestionarMercado() {
        try {
            // 1. Resolver subastas que ya hayan expirado
            mercadoService.resolverSubastasExpiradas();

            // 2. Comprobar si alguna liga necesita nuevos jugadores
            List<Liga> todasLasLigas = ligaRepository.findAll();
            LocalDateTime ahora = clockService.ahora();

            for (Liga liga : todasLasLigas) {
                try {
                    boolean tieneSubastasActivas = subastaRepository.existsByLigaIdAndFinalizadaFalse(liga.getId());

                    if (!tieneSubastasActivas) {
                        System.out.println("Programando nuevas subastas para la liga: " + liga.getNombre());
                        // El reset es a la hora en que se creó la liga
                        LocalTime horaReset = liga.getCreatedAt().toLocalTime();

                        LocalDateTime proximoFin = ahora.toLocalDate().atTime(horaReset);
                        // Si la hora de reset ya pasó o es justo ahora, el próximo fin es mañana
                        if (!proximoFin.isAfter(ahora)) {
                            proximoFin = proximoFin.plusDays(1);
                        }

                        // Generamos subastas con fecha fin en el próximo reset
                        mercadoService.generarSubastasConFechaFin(liga, proximoFin);
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
