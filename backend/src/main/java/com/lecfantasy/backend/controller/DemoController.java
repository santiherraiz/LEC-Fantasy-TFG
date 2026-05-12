package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.repository.SubastaRepository;
import com.lecfantasy.backend.service.ClockService;
import com.lecfantasy.backend.service.DemoService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    @Autowired
    private ClockService clockService;
    @Autowired
    private DemoService demoService;
    @Autowired
    private MercadoService mercadoService;
    @Autowired
    private SubastaRepository subastaRepository;

    /**
     * AVANZAR DÍA (+24h)
     * Dispara fluctuación, resuelve subastas y hace snapshots si toca.
     */
    @PostMapping("/avanzar-dia")
    public ResponseEntity<String> avanzarDia() {
        if (!clockService.isModoDemoActivo()) {
            return ResponseEntity.status(403).body("❌ El avance manual solo está permitido en Modo Demo.");
        }

        LocalDateTime anterior = clockService.ahora();

        // 1. Adelantamos el reloj
        demoService.avanzarDia();

        // 2. BUSCAMOS subastas que caduquen en este salto de tiempo para resolverlas
        LocalDateTime nuevoTiempo = clockService.ahora();
        subastaRepository.findByFinalizadaFalse().forEach(s -> {
            if (s.getFechaFin().isBefore(nuevoTiempo)) {
                s.setFechaFin(nuevoTiempo.minusMinutes(1));
                subastaRepository.save(s);
            }
        });

        // 3. Refrescar mercado (resuelve expiradas y genera nuevas)
        mercadoService.forzarRefrescoMercado();

        return ResponseEntity.ok("⏰ TIEMPO AVANZADO: De " + anterior + " a " + nuevoTiempo + ". Mercado actualizado.");
    }

    /**
     * ESTABLECER HORA ESPECÍFICA
     * Útil para ponerse 1 min antes del cierre de mercado (16:00).
     */
    @PostMapping("/set-hora")
    public ResponseEntity<String> setHora(@RequestParam int hora, @RequestParam int minuto) {
        if (!clockService.isModoDemoActivo()) {
            return ResponseEntity.status(403).body("❌ El ajuste de hora solo está permitido en Modo Demo.");
        }
        demoService.establecerHora(hora, minuto);
        return ResponseEntity.ok("🕒 Hora ajustada a las " + hora + ":" + minuto);
    }
}
