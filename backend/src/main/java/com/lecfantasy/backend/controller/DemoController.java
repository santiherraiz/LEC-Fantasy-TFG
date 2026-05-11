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
     * 1. INICIAR TEMPORADA DEMO (Semanas 91-97)
     * Resetea el reloj a 1 semana antes de la jornada 91.
     */
    @PostMapping("/iniciar-temporada")
    public ResponseEntity<String> iniciarTemporada() {
        demoService.iniciarTemporadaDemo();
        return ResponseEntity.ok("🎬 DEMO INICIADA: Reloj en Junio 2026, 7 semanas (91-97) listas con datos reales.");
    }

    /**
     * 2. AVANZAR DÍA (+24h)
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
     * 3. ESTABLECER HORA ESPECÍFICA
     * Útil para ponerse 1 min antes del cierre de mercado (16:00).
     */
    @PostMapping("/set-hora")
    public ResponseEntity<String> setHora(@RequestParam int hora, @RequestParam int minuto) {
        demoService.establecerHora(hora, minuto);
        return ResponseEntity.ok("🕒 Hora ajustada a las " + hora + ":" + minuto);
    }

    /**
     * 4. INYECTAR RESULTADOS REALES DE UNA SEMANA
     * Se debe llamar cuando la semana simulada ya ha terminado cronológicamente.
     */
    @PostMapping("/procesar-semana")
    public ResponseEntity<String> procesarSemana(@RequestParam int semanaDemo) {
        demoService.inyectarResultadosDeSemana(semanaDemo);
        return ResponseEntity.ok("🔥 RESULTADOS INYECTADOS para la Semana " + semanaDemo + ". Puntos calculados.");
    }

    /**
     * 5. RESTAURAR REALIDAD
     * Borra todo lo de demo y vuelve al tiempo actual con presupuestos reales.
     */
    @PostMapping("/restaurar-realidad")
    public ResponseEntity<String> restaurarRealidad() {
        demoService.restaurarMundoReal();
        return ResponseEntity.ok("🏠 DE VUELTA A LA REALIDAD: Datos demo eliminados y presupuestos restaurados.");
    }
}
