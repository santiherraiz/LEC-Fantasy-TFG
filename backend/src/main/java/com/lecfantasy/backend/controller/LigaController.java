package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.service.LigaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LigaController {

    @Autowired
    private LigaService ligaService;

    @PostMapping("/ligas/crear")
    public ResponseEntity<?> crearLiga(@RequestBody Map<String, Object> payload) {
        String nombre = (String) payload.get("nombre");
        Long adminId = Long.valueOf(payload.get("adminId").toString());
        Liga liga = ligaService.crearLiga(nombre, adminId);
        return ResponseEntity.ok(liga);
    }

    @PostMapping("/ligas/unirse")
    public ResponseEntity<?> unirseALiga(@RequestBody Map<String, Object> payload) {
        String codigo = (String) payload.get("codigoAcceso");
        Long usuarioId = Long.valueOf(payload.get("usuarioId").toString());
        ligaService.unirseALiga(codigo, usuarioId);
        return ResponseEntity.ok(Map.of("message", "Te has unido a la liga con éxito"));
    }

    @GetMapping("/usuarios/{usuarioId}/mis-ligas")
    public ResponseEntity<List<Liga>> obtenerMisLigas(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(ligaService.obtenerLigasDeUsuario(usuarioId));
    }
}
