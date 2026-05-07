package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.EquipoDetalleDTO;
import com.lecfantasy.backend.dto.RankingDTO;
import com.lecfantasy.backend.dto.EquipoRivalDTO;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EquipoService {

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private PlantillaRepository plantillaRepository;

    public EquipoDetalleDTO obtenerDetalleEquipo(Long usuarioId, Long ligaId) {
        // ... (contenido anterior se mantiene igual)
        Equipo equipo = equipoRepository.findByUsuarioIdAndLigaId(usuarioId, ligaId)
                .orElseThrow(() -> new RuntimeException("El usuario no tiene un equipo creado en esta liga."));

        List<Plantilla> plantillas = plantillaRepository.findByEquipoId(equipo.getId());

        EquipoDetalleDTO respuesta = new EquipoDetalleDTO();
        respuesta.setEquipoId(equipo.getId());
        respuesta.setNombreEquipo(equipo.getNombreEquipo());
        respuesta.setPresupuestoDisponible(equipo.getPresupuestoDisponible());
        respuesta.setPuntuacionTotal(equipo.getPuntuacionTotal());

        List<EquipoDetalleDTO.JugadorEnPlantillaDTO> jugadoresDTO = plantillas.stream().map(p -> {
            EquipoDetalleDTO.JugadorEnPlantillaDTO dto = new EquipoDetalleDTO.JugadorEnPlantillaDTO();
            dto.setIdJugador(p.getJugador().getId());
            dto.setNickname(p.getJugador().getNickname());
            dto.setRol(p.getJugador().getRol());
            dto.setEstado(p.getEstado().name());
            return dto;
        }).collect(Collectors.toList());

        respuesta.setJugadores(jugadoresDTO);
        return respuesta;
    }

    public EquipoRivalDTO obtenerEquipoRival(Long equipoId) {
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));

        List<Plantilla> plantillas = plantillaRepository.findByEquipoId(equipo.getId());

        EquipoRivalDTO dto = new EquipoRivalDTO();
        dto.setId(equipo.getId());
        dto.setNombreUsuario(equipo.getUsuario().getNickname());
        dto.setPresupuesto(equipo.getPresupuestoDisponible());
        dto.setPuntosTotales(equipo.getPuntuacionTotal());

        List<EquipoRivalDTO.JugadorEnEquipoDTO> jugadores = plantillas.stream().map(p -> {
            EquipoRivalDTO.JugadorEnEquipoDTO jDto = new EquipoRivalDTO.JugadorEnEquipoDTO();
            jDto.setId(p.getJugador().getId());
            jDto.setNickname(p.getJugador().getNickname());
            jDto.setFoto(p.getJugador().getImagenUrl());
            jDto.setRol(p.getJugador().getRol());
            jDto.setEquipoLec(p.getJugador().getEquipoLec() != null ? p.getJugador().getEquipoLec().getNombre() : "S/E");
            jDto.setPrecioBase(p.getJugador().getPrecioBase());
            jDto.setEstado(p.getEstado().name());
            return jDto;
        }).collect(Collectors.toList());

        dto.setJugadores(jugadores);
        return dto;
    }

    public List<RankingDTO> obtenerRanking(Long ligaId) {
        // 1. Buscamos todos los equipos de la liga ordenados por puntos de mayor a menor
        List<Equipo> equipos = equipoRepository.findAllByLigaIdOrderByPuntuacionTotalDesc(ligaId);

        // 2. Los transformamos a una lista de DTOs para no devolver emails/passwords
        return equipos.stream().map(e -> {
            RankingDTO dto = new RankingDTO();
            dto.setEquipoId(e.getId());
            dto.setNombreUsuario(e.getUsuario().getNickname());
            dto.setPuntosTotales(e.getPuntuacionTotal());
            return dto;
        }).collect(Collectors.toList());
    }
}
