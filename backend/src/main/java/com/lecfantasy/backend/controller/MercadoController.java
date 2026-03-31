package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.FichajeRequest;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    @Autowired
    private MercadoService mercadoService;

    // Inyectamos el servicio de jugadores
    @Autowired
    private JugadorService jugadorService;

    @PostMapping("/fichar")
    public ResponseEntity<?> fichar(@RequestBody FichajeRequest request) {
        try {
            String mensaje = mercadoService.ficharJugador(request.getUsuarioId(), request.getJugadorId());
            return ResponseEntity.ok(mensaje);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/jugadores")
    public ResponseEntity<List<Jugador>> obtenerMercado() {
        List<Jugador> jugadores = jugadorService.obtenerTodosLosJugadores();
        return ResponseEntity.ok(jugadores);
    }

    @PostMapping("/vender")
    public ResponseEntity<?> vender(@RequestBody com.lecfantasy.backend.dto.VentaRequest request) {
        try {
            String mensaje = mercadoService.venderJugador(request.getEquipoId(), request.getJugadorId());
            return ResponseEntity.ok(mensaje);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}