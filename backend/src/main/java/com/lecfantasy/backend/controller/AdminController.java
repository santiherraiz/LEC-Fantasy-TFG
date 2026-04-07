package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.PuntuacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PuntuacionService puntuacionService;

    @PostMapping("/procesar-pendientes")
    public ResponseEntity<String> procesarPartidosPendientes() {
        try {
            String resultado = puntuacionService.procesarPartidosPendientes();
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}