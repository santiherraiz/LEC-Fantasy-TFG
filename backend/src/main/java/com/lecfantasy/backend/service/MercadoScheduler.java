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

@Service
public class MercadoScheduler {

    @Autowired
    private MercadoService mercadoService;

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private ClockService clockService;

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
