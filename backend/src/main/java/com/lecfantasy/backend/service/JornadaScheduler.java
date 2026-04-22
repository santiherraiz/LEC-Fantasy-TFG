package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.JornadaEstado;
import com.lecfantasy.backend.repository.JornadaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class JornadaScheduler {

    @Autowired private JornadaService jornadaService;
    @Autowired private PuntuacionService puntuacionService;
    @Autowired private JornadaRepository jornadaRepository;

    @Scheduled(fixedDelay = 300000) 
    public void monitorizarJornadas() {
        LocalDateTime ahora = LocalDateTime.now();
        System.out.println("⏰ [SCHEDULER] " + ahora);

        // 1. Snapshot automático (Solo una a la vez por orden)
        jornadaService.obtenerJornadaSiguiente().ifPresent(jornada -> {
            if (ahora.isAfter(jornada.getFechaInicio().minusMinutes(15))) {
                System.out.println("📸 [SCHEDULER] Snapshot automático: Semana " + jornada.getNumeroSemana());
                puntuacionService.hacerSnapshotSemana(jornada.getNumeroSemana());
                jornada.setEstado(JornadaEstado.BLOQUEADA);
                jornada.setSnapshotRealizado(true);
                jornadaRepository.save(jornada);
            }
        });

        // 2. Gestión de estados (BLOQUEADA -> PROCESANDO cuando termina cronológicamente)
        List<Jornada> bloqueadas = jornadaRepository.findAllByEstado(JornadaEstado.BLOQUEADA);
        for (Jornada j : bloqueadas) {
            if (ahora.isAfter(j.getFechaFin())) {
                j.setEstado(JornadaEstado.PROCESANDO);
                jornadaRepository.save(j);
                System.out.println("⚙️ [SCHEDULER] Semana " + j.getNumeroSemana() + " pasa a estado PROCESANDO.");
            }
        }

        // 3. Procesamiento de resultados (Solo jornadas BLOQUEADAS o PROCESANDO)
        // Intentamos importar de todas las pendientes
        puntuacionService.importarPartidosDeLeaguepedia();
        puntuacionService.importarEstadisticasDeLeaguepedia();
        puntuacionService.calcularPuntos();

        // 4. Intentar cerrar jornadas en estado PROCESANDO
        List<Jornada> procesando = jornadaRepository.findAllByEstado(JornadaEstado.PROCESANDO);
        for (Jornada j : procesando) {
            long pendientes = puntuacionService.contarPartidosPendientes(j);
            if (pendientes == 0) {
                j.setEstado(JornadaEstado.FINALIZADA);
                j.setPuntosCalculados(true);
                jornadaRepository.save(j);
                System.out.println("✅ [SCHEDULER] Semana " + j.getNumeroSemana() + " FINALIZADA.");
            } else {
                System.out.println("⏳ [SCHEDULER] Semana " + j.getNumeroSemana() + " en espera de " + pendientes + " partidos.");
            }
        }
    }

    @Scheduled(cron = "0 0 4 * * *")
    public void sincronizacionDiaria() {
        jornadaService.sincronizarCalendario();
    }
}
