package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.FichajeRequest;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    @Autowired
    private MercadoService mercadoService;

    @PostMapping("/fichar")
    public ResponseEntity<?> fichar(@RequestBody FichajeRequest request) {
        try {
            String mensaje = mercadoService.ficharJugador(request.getUsuarioId(), request.getJugadorId());
            return ResponseEntity.ok(mensaje);
        } catch (RuntimeException e) {
            // Si salta alguna de nuestras validaciones (sin dinero, ya fichado, etc.), devolvemos un error 400
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}