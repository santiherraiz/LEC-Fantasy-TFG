package com.lecfantasy.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DemoService {

    @Autowired
    private ClockService clockService;
    @Autowired
    private MercadoService mercadoService;
    @Autowired
    private MercadoScheduler mercadoScheduler;

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
}
