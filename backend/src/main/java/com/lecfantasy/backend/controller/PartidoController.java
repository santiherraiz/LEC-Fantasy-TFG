package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.JornadaCalendarioDTO;
import com.lecfantasy.backend.service.PartidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

    @Autowired
    private PartidoService partidoService;

    @GetMapping("/calendario")
    public ResponseEntity<List<JornadaCalendarioDTO>> obtenerCalendario() {
        return ResponseEntity.ok(partidoService.obtenerCalendario());
    }
}
