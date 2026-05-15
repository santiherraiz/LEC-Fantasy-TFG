package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.JornadaEstado;
import com.lecfantasy.backend.repository.JornadaRepository;
import com.lecfantasy.backend.service.PuntuacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jornadas")
public class JornadaController {

    @Autowired
    private JornadaRepository jornadaRepository;

    @Autowired
    private PuntuacionService puntuacionService;

    @GetMapping
    public ResponseEntity<List<Jornada>> obtenerTodas() {
        List<Jornada> todas = jornadaRepository.findAll();

        return ResponseEntity.ok(todas.stream()
                .filter(j -> {
                    // Se muestra una jornada si:
                    // - Ya ha empezado o terminado (BLOQUEADA, PROCESANDO, FINALIZADA)
                    // - Es la siguiente jornada programada tras la última jugada
                    if (j.getEstado() != JornadaEstado.PROGRAMADA)
                        return true;

                    // Si es PROGRAMADA, solo se muestra si es la inmediata siguiente
                    Optional<Jornada> anterior = jornadaRepository.findByNumeroSemana(j.getNumeroSemana() - 1);
                    return anterior.isEmpty() || anterior.get().getEstado() != JornadaEstado.PROGRAMADA;
                })
                .sorted((a, b) -> b.getNumeroSemana() - a.getNumeroSemana())
                .collect(java.util.stream.Collectors.toList()));
    }

    @GetMapping("/actual")
    public ResponseEntity<Jornada> obtenerActual() {
        int semana = puntuacionService.obtenerSemanaActual();
        return ResponseEntity.of(jornadaRepository.findByNumeroSemana(semana));
    }
}
