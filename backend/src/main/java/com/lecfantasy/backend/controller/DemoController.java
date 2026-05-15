package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.repository.SubastaRepository;
import com.lecfantasy.backend.service.ClockService;
import com.lecfantasy.backend.service.DemoService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import com.lecfantasy.backend.dto.MessageResponse;

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
    public ResponseEntity<MessageResponse> avanzarDia() {
        if (!clockService.isModoDemoActivo()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("El avance manual solo está permitido en Modo Demo."));
        }

        LocalDateTime anterior = clockService.ahora();

        // Se adelanta el reloj
        demoService.avanzarDia();

        // Se buscan subastas que caduquen en este salto de tiempo para resolverlas
        LocalDateTime nuevoTiempo = clockService.ahora();
        subastaRepository.findByFinalizadaFalse().forEach(s -> {
            if (s.getFechaFin().isBefore(nuevoTiempo)) {
                s.setFechaFin(nuevoTiempo.minusMinutes(1));
                subastaRepository.save(s);
            }
        });

        // Se refresca el mercado (resuelve expiradas y genera nuevas)
        mercadoService.forzarRefrescoMercado();

        return ResponseEntity.ok(new MessageResponse(
                "TIEMPO AVANZADO: De " + anterior + " a " + nuevoTiempo + ". Mercado actualizado."));
    }

    /**
     * Se pone la hora 1 min antes del cierre de mercado (16:00).
     */
    @PostMapping("/set-hora")
    public ResponseEntity<MessageResponse> setHora(@RequestParam int hora, @RequestParam int minuto) {
        if (!clockService.isModoDemoActivo()) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("El ajuste de hora solo está permitido en Modo Demo."));
        }
        demoService.establecerHora(hora, minuto);
        return ResponseEntity.ok(new MessageResponse("Hora ajustada a las " + hora + ":" + minuto));
    }
}
