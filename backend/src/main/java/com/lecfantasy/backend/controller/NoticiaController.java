package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.dto.NoticiaLigaDTO;
import com.lecfantasy.backend.entity.NoticiaLiga;
import com.lecfantasy.backend.service.NoticiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/noticias")
public class NoticiaController {

    @Autowired
    private NoticiaService noticiaService;

    @GetMapping("/{ligaId}")
    public ResponseEntity<List<NoticiaLigaDTO>> obtenerNoticias(
            @PathVariable Long ligaId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<NoticiaLiga> noticias = noticiaService.obtenerNoticias(ligaId, pagina, size);
        
        List<NoticiaLigaDTO> dtos = noticias.getContent().stream().map(n -> {
            NoticiaLigaDTO dto = new NoticiaLigaDTO();
            dto.setId(n.getId());
            dto.setTipoNoticia(n.getTipoNoticia());
            dto.setMensaje(n.getMensaje());
            dto.setFecha(n.getFecha());
            dto.setJugadorId(n.getJugadorId());
            dto.setEquipoId(n.getEquipoId());
            dto.setImagenUrl(n.getImagenUrl());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
