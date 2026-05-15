package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.SubastaDTO;
import com.lecfantasy.backend.dto.CatalogoJugadorDTO;
import com.lecfantasy.backend.dto.MarketActionRequest;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.service.JugadorService;
import com.lecfantasy.backend.service.MercadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.lecfantasy.backend.dto.MessageResponse;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    @Autowired
    private MercadoService mercadoService;

    @Autowired
    private JugadorService jugadorService;

    @GetMapping("/subastas")
    public ResponseEntity<List<SubastaDTO>> obtenerSubastas(
            @RequestParam Long ligaId,
            @RequestParam Long usuarioId) {
        return ResponseEntity.ok(mercadoService.obtenerSubastasActivas(ligaId, usuarioId));
    }

    @PostMapping("/pujar")
    public ResponseEntity<MessageResponse> pujar(@RequestBody MarketActionRequest request) {
        String msg = mercadoService.pujar(request);
        return ResponseEntity.ok(new MessageResponse(msg));
    }

    @DeleteMapping("/pujar")
    public ResponseEntity<MessageResponse> eliminarPuja(
            @RequestParam Long subastaId,
            @RequestParam Long usuarioId) {
        String msg = mercadoService.eliminarPuja(subastaId, usuarioId);
        return ResponseEntity.ok(new MessageResponse(msg));
    }

    @GetMapping("/catalogo")
    public ResponseEntity<List<CatalogoJugadorDTO>> obtenerCatalogo(@RequestParam Long ligaId) {
        return ResponseEntity.ok(mercadoService.obtenerCatalogo(ligaId));
    }

    @GetMapping("/jugadores")
    public ResponseEntity<List<Jugador>> obtenerMercado() {
        List<Jugador> jugadores = jugadorService.obtenerTodosLosJugadores();
        return ResponseEntity.ok(jugadores);
    }

    @PostMapping("/vender")
    public ResponseEntity<MessageResponse> vender(@RequestBody MarketActionRequest request) {
        String msg = mercadoService.venderJugador(request.getEquipoId(), request.getJugadorId());
        return ResponseEntity.ok(new MessageResponse(msg));
    }

    @GetMapping("/equipos-lec")
    public ResponseEntity<Map<String, List<Jugador>>> obtenerEquiposLec() {
        List<Jugador> todos = jugadorService.obtenerTodosLosJugadores();

        Map<String, List<Jugador>> agrupadosPorEquipo = todos.stream()
                .filter(j -> j.getEquipoLec() != null)
                .collect(Collectors.groupingBy(j -> j.getEquipoLec().getNombre()));

        return ResponseEntity.ok(agrupadosPorEquipo);
    }

    @PostMapping("/clausulazo")
    public ResponseEntity<MessageResponse> ejecutarClausulazo(@RequestBody MarketActionRequest request) {
        String msg = mercadoService.ejecutarClausulazo(request.getUsuarioId(), request.getJugadorId(),
                request.getLigaId());
        return ResponseEntity.ok(new MessageResponse(msg));
    }
}
