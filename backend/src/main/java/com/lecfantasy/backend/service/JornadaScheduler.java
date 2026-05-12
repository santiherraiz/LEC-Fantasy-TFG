package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.JornadaEstado;
import com.lecfantasy.backend.entity.TipoNoticia;
import com.lecfantasy.backend.repository.JornadaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.core.env.Environment;
import java.util.Arrays;
import java.util.List;

@Component
public class JornadaScheduler {

    @Autowired
    private Environment env;

    @Autowired
    private JornadaService jornadaService;
    @Autowired
    private PuntuacionService puntuacionService;
    @Autowired
    private JugadorService jugadorService;
    @Autowired
    private JornadaRepository jornadaRepository;
    @Autowired
    private ClockService clockService;
    @Autowired
    private NoticiaService noticiaService;

    /**
     * ¡Magia! En cuanto el servidor arranca, se sincroniza todo solo.
     * EXCEPCIÓN: En modo demo no sincronizamos al arrancar para que el usuario sea el "Dios del Tiempo".
     */
    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        System.out.println("🚀 [SISTEMA] Backend listo. Iniciando auto-sincronización inicial...");
        jornadaService.sincronizarCalendario();
        puntuacionService.importarPartidosDeLeaguepedia();
        jugadorService.importarJugadoresDeLeaguepedia();
        System.out.println("✅ [SISTEMA] Auto-sincronización completada.");
    }

    // Bajamos a 1 minuto (60,000 ms) para máxima respuesta
    @Scheduled(fixedDelay = 60000)
    public void monitorizarJornadas() {
        java.time.LocalDateTime ahora = clockService.ahora();
        System.out.println("⏰ [SCHEDULER] " + ahora);

        // 1. Snapshot automático
        jornadaService.obtenerJornadaSiguiente().ifPresent(jornada -> {
            if (ahora.isAfter(jornada.getFechaInicio().minusMinutes(15))) {
                System.out.println("📸 [SCHEDULER] Snapshot automático: Semana " + jornada.getNumeroSemana());
                puntuacionService.hacerSnapshotSemana(jornada.getNumeroSemana());
                jornada.setEstado(JornadaEstado.BLOQUEADA);
                jornadaRepository.save(jornada);
            }
        });

        // 2. Transición a PROCESANDO
        List<Jornada> bloqueadas = jornadaRepository.findAllByEstado(JornadaEstado.BLOQUEADA);
        for (Jornada j : bloqueadas) {
            if (ahora.isAfter(j.getFechaFin())) {
                j.setEstado(JornadaEstado.PROCESANDO);
                jornadaRepository.save(j);
                System.out.println("⚙️ [SCHEDULER] Semana " + j.getNumeroSemana() + " pasa a PROCESANDO.");
            }
        }

        // 3. Procesamiento Live
        if (Arrays.asList(env.getActiveProfiles()).contains("demo")) {
            // En demo, necesitamos re-importar el calendario a menudo para que los partidos
            // "descubran" su ganador a medida que el reloj avanza.
            puntuacionService.importarPartidosDeLeaguepedia();
        }
        
        puntuacionService.importarEstadisticasDeLeaguepedia();
        puntuacionService.calcularPuntos();

        // 4. Cierre de jornadas
        List<Jornada> procesando = jornadaRepository.findAllByEstado(JornadaEstado.PROCESANDO);
        for (Jornada j : procesando) {
            long pendientes = puntuacionService.contarPartidosPendientes(j);
            if (pendientes == 0) {
                j.setEstado(JornadaEstado.FINALIZADA);
                jornadaRepository.save(j);
                System.out.println("✅ [SCHEDULER] Semana " + j.getNumeroSemana() + " FINALIZADA.");

                // Noticia de fin de jornada
                // Como las noticias son por liga, tenemos que iterar o buscar una forma de llegar a todas las ligas
                // Por simplicidad en este proyecto, solemos tener una o pocas ligas.
                noticiaService.crearNoticiaParaTodasLasLigas(
                    TipoNoticia.RESULTADO_JORNADA,
                    String.format("¡La Jornada %d ha finalizado! Revisa el ranking para ver tu posición.", j.getNumeroSemana()),
                    null, null, null
                );
            } else {
                // Solo logueamos si han pasado más de 2 horas del fin para no saturar la
                // consola cada minuto
                if (ahora.isAfter(j.getFechaFin().plusHours(2))) {
                    System.out.println(
                            "⏳ [SCHEDULER] Semana " + j.getNumeroSemana() + " esperando " + pendientes + " partidos.");
                }
            }
        }
    }

    @Scheduled(cron = "0 0 4 * * *")
    public void sincronizacionDiaria() {
        jornadaService.sincronizarCalendario();
        puntuacionService.importarPartidosDeLeaguepedia();
    }
}
