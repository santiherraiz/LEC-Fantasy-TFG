package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DemoService {

    @Autowired
    private ClockService clockService;
    @Autowired
    private JornadaRepository jornadaRepository;
    @Autowired
    private PartidoRepository partidoRepository;
    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private PuntuacionService puntuacionService;
    @Autowired
    private MercadoService mercadoService;
    @Autowired
    private MercadoScheduler mercadoScheduler;
    @Autowired
    private SubastaRepository subastaRepository;

    /**
     * INICIO DE LA DEMO: Prepara las 7 semanas (91-97) clonando datos reales.
     */
    @Transactional
    public void iniciarTemporadaDemo() {
        // 1. Activar Modo Demo y Snapshot
        java.util.Map<Long, Double> snapshot = new java.util.HashMap<>();
        equipoRepository.findAll().forEach(e -> snapshot.put(e.getId(), e.getPresupuestoDisponible()));

        // Reloj: Empezamos el 22 de Junio 2026 (una semana antes de la Jornada 91)
        LocalDateTime fechaBaseDemo = LocalDateTime.of(2026, 6, 22, 10, 0);
        clockService.activarModoDemo(fechaBaseDemo, snapshot);

        // 2. Limpiar todo lo anterior de demo (Aseguramos limpieza total)
        for (int i = 91; i <= 99; i++) {
            puntuacionService.limpiarJornada(i);
            final int sem = i;
            jornadaRepository.findByNumeroSemana(sem).ifPresent(j -> jornadaRepository.delete(j));
        }

        // 3. Clonar las 7 semanas reales
        for (int i = 1; i <= 7; i++) {
            clonarSemanaRealADemo(i, 90 + i);
        }

        // 4. Inyectar Dinero y resetear puntos
        equipoRepository.findAll().forEach(e -> {
            e.setPresupuestoDisponible(100000.0); // 100k para empezar
            e.setPuntuacionTotal(0.0);
            equipoRepository.save(e);
        });

        System.out.println("🎬 DEMO INICIADA: Semanas 91-97 listas.");
    }

    private void clonarSemanaRealADemo(int semanaReal, int semanaDemo) {
        Jornada real = jornadaRepository.findByNumeroSemana(semanaReal).orElse(null);
        if (real == null)
            return;

        // Crear Jornada Demo (Desplazada al verano de 2026)
        Jornada demo = new Jornada();
        demo.setNumeroSemana(semanaDemo);
        demo.setFechaInicio(real.getFechaInicio().plusWeeks(13));
        demo.setFechaFin(real.getFechaFin().plusWeeks(13));
        demo.setEstado(JornadaEstado.PROGRAMADA);
        jornadaRepository.save(demo);

        // Clonar Partidos
        List<Partido> partidosReales = partidoRepository.findByJornada(real);
        for (Partido pReal : partidosReales) {
            Partido pDemo = new Partido();
            pDemo.setGameId("DEMO_" + pReal.getGameId());
            pDemo.setSerieId("DEMO_" + pReal.getSerieId());
            pDemo.setTeam1(pReal.getTeam1());
            pDemo.setTeam2(pReal.getTeam2());
            pDemo.setTeam1Entity(pReal.getTeam1Entity());
            pDemo.setTeam2Entity(pReal.getTeam2Entity());
            pDemo.setJornada(demo);
            pDemo.setFechaUtc(pReal.getFechaUtc().plusWeeks(13));
            pDemo.setEstadisticasImportadas(false);
            pDemo.setPuntosCalculados(false);
            partidoRepository.save(pDemo);
        }
    }

    @Transactional
    public void avanzarDia() {
        LocalDateTime actual = clockService.ahora();
        LocalDateTime siguiente = actual.plusDays(1);
        clockService.establecerFechaSimulada(siguiente);

        // Al avanzar el día, el mercado debe reaccionar
        mercadoScheduler.recalcularPreciosDiarios();
        mercadoService.forzarRefrescoMercado();

        System.out.println("⏰ Reloj avanzado a: " + siguiente);
    }

    @Transactional
    public void establecerHora(int hora, int minuto) {
        LocalDateTime actual = clockService.ahora();
        LocalDateTime nueva = actual.withHour(hora).withMinute(minuto).withSecond(0);
        clockService.establecerFechaSimulada(nueva);
        System.out.println("🕒 Hora ajustada a: " + nueva);
    }

    @Transactional
    public void inyectarResultadosDeSemana(int semanaDemo) {
        Jornada demo = jornadaRepository.findByNumeroSemana(semanaDemo)
                .orElseThrow(() -> new RuntimeException("Jornada demo no encontrada"));

        List<Partido> partidosDemo = partidoRepository.findByJornada(demo);
        for (Partido pDemo : partidosDemo) {
            String originalGameId = pDemo.getGameId().replace("DEMO_", "");
            Optional<Partido> originalOpt = partidoRepository.findById(originalGameId);

            if (originalOpt.isPresent()) {
                Partido pReal = originalOpt.get();
                pDemo.setWinTeam(pReal.getWinTeam());
                pDemo.setLossTeam(pReal.getLossTeam());
                pDemo.setWinTeamEntity(pReal.getWinTeamEntity());
                pDemo.setLossTeamEntity(pReal.getLossTeamEntity());
                pDemo.setEstadisticasImportadas(true);
                partidoRepository.save(pDemo);

                // Clonar Estadísticas Reales
                List<EstadisticaPartido> statsReales = estadisticaPartidoRepository.findByPartidoGameId(originalGameId);
                for (EstadisticaPartido sReal : statsReales) {
                    EstadisticaPartido sDemo = new EstadisticaPartido();
                    sDemo.setPartido(pDemo);
                    sDemo.setJugador(sReal.getJugador());
                    sDemo.setKills(sReal.getKills());
                    sDemo.setDeaths(sReal.getDeaths());
                    sDemo.setAssists(sReal.getAssists());
                    sDemo.setCs(sReal.getCs());
                    sDemo.setGold(sReal.getGold());
                    sDemo.setEquipoNombre(sReal.getEquipoNombre());
                    sDemo.setPuntosGenerados(0.0);
                    sDemo.setPuntosReales(sReal.getPuntosReales());
                    estadisticaPartidoRepository.save(sDemo);
                }
            }
        }
        // Calcular puntos basados en las stats clonadas
        puntuacionService.calcularPuntos();
    }

    @Transactional
    public void limpiarTodasLasSemanasDemo() {
        for (int i = 91; i <= 99; i++) {
            puntuacionService.limpiarJornada(i);
        }
    }

    @Transactional
    public void restaurarMundoReal() {
        java.util.Map<Long, Double> backup = clockService.desactivarModoDemo();
        backup.forEach((id, presupuesto) -> {
            equipoRepository.findById(id).ifPresent(e -> {
                e.setPresupuestoDisponible(presupuesto);
                equipoRepository.save(e);
            });
        });
        limpiarTodasLasSemanasDemo();

        // Borrar todas las subastas activas para que al refrescar se generen con la
        // fecha real actual
        subastaRepository.deleteAll();

        mercadoService.forzarRefrescoMercado();
    }
}
