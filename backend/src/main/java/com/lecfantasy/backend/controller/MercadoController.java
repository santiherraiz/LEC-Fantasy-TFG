package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.FichajeRequest;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    @Autowired
    private MercadoService mercadoService;

    // Inyectamos el servicio de jugadores
    @Autowired
    private JugadorService jugadorService;

    @PostMapping("/fichar")
    public ResponseEntity<String> fichar(@RequestBody FichajeRequest request) {
        String mensaje = mercadoService.ficharJugador(request.getUsuarioId(), request.getJugadorId());
        return ResponseEntity.ok(mensaje);
    }

    @GetMapping("/jugadores")
    public ResponseEntity<List<Jugador>> obtenerMercado() {
        List<Jugador> jugadores = jugadorService.obtenerTodosLosJugadores();
        return ResponseEntity.ok(jugadores);
    }

    @PostMapping("/vender")
    public ResponseEntity<String> vender(@RequestBody com.lecfantasy.backend.dto.VentaRequest request) {
        String mensaje = mercadoService.venderJugador(request.getEquipoId(), request.getJugadorId());
        return ResponseEntity.ok(mensaje);
    }

    @GetMapping("/equipos-lec")
    public ResponseEntity<Map<String, List<Jugador>>> obtenerEquiposLec() {
        List<Jugador> todos = jugadorService.obtenerTodosLosJugadores();

        Map<String, List<Jugador>> agrupadosPorEquipo = todos.stream()
                .filter(j -> j.getEquipoLec() != null) // Filtro de seguridad
                .collect(Collectors.groupingBy(j -> j.getEquipoLec().getNombre()));

        return ResponseEntity.ok(agrupadosPorEquipo);
    }
}
