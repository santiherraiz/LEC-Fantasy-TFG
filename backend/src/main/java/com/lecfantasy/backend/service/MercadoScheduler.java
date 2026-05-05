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

    // Se ejecuta cada minuto
    @Scheduled(fixedRate = 60000)
    public void gestionarMercado() {
        // 1. Resolver subastas que ya hayan expirado
        mercadoService.resolverSubastasExpiradas();

        // 2. Comprobar si alguna liga necesita nuevos jugadores
        List<Liga> todasLasLigas = ligaRepository.findAll();
        LocalDateTime ahora = LocalDateTime.now();

        for (Liga liga : todasLasLigas) {
            boolean tieneSubastasActivas = subastaRepository.existsByLigaIdAndFinalizadaFalse(liga.getId());

            if (!tieneSubastasActivas) {
                // Si no hay subastas activas, comprobamos si es momento de generar nuevas
                // El reset es a la hora en que se creó la liga
                LocalTime horaReset = liga.getCreatedAt().toLocalTime();
                
                // Si ya ha pasado la hora de reset hoy, o si nunca se han generado
                // (Para simplificar, generamos si no hay activas)
                
                LocalDateTime proximoFin = ahora.toLocalDate().atTime(horaReset);
                if (proximoFin.isBefore(ahora)) {
                    proximoFin = proximoFin.plusDays(1);
                }

                // Generamos subastas con fecha fin en el próximo reset
                mercadoService.generarSubastasConFechaFin(liga, proximoFin);
            }
        }
    }
}
