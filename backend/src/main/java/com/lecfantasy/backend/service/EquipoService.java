package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.EquipoDetalleDTO;
import com.lecfantasy.backend.dto.RankingDTO;
import com.lecfantasy.backend.dto.EquipoRivalDTO;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EquipoService {

    private static final Logger log = LoggerFactory.getLogger(EquipoService.class);

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private PlantillaRepository plantillaRepository;

    public EquipoDetalleDTO obtenerDetalleEquipo(Long usuarioId, Long ligaId) {
        log.debug("Obteniendo detalle de equipo para usuarioId: {} y ligaId: {}", usuarioId, ligaId);
        
        Equipo equipo = equipoRepository.findByUsuarioIdAndLigaId(usuarioId, ligaId)
                .orElseThrow(() -> new RuntimeException("El usuario no tiene un equipo creado en esta liga."));

        List<Plantilla> plantillas = plantillaRepository.findByEquipoId(equipo.getId());
        log.debug("Encontrados {} jugadores en la plantilla del equipo {}", plantillas.size(), equipo.getId());

        EquipoDetalleDTO respuesta = new EquipoDetalleDTO();
        respuesta.setEquipoId(equipo.getId());
        respuesta.setNombreEquipo(equipo.getNombreEquipo());
        respuesta.setPresupuestoDisponible(equipo.getPresupuestoDisponible());
        respuesta.setPuntuacionTotal(equipo.getPuntuacionTotal());

        List<EquipoDetalleDTO.JugadorEnPlantillaDTO> jugadoresDTO = plantillas.stream().map(p -> {
            EquipoDetalleDTO.JugadorEnPlantillaDTO dto = new EquipoDetalleDTO.JugadorEnPlantillaDTO();
            if (p.getJugador() != null) {
                dto.setIdJugador(p.getJugador().getId());
                dto.setNickname(p.getJugador().getNickname());
                dto.setRol(p.getJugador().getRol());
                dto.setImagenUrl(p.getJugador().getImagenUrl());
                dto.setPrecio(p.getJugador().getPrecioActual() != null ? p.getJugador().getPrecioActual() : p.getJugador().getPrecioBase());
            }
            dto.setEstado(p.getEstado() != null ? p.getEstado().name() : EstadoAlineacion.BANQUILLO.name());
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
            if (p.getJugador() != null) {
                jDto.setId(p.getJugador().getId());
                jDto.setNickname(p.getJugador().getNickname());
                jDto.setFoto(p.getJugador().getImagenUrl());
                jDto.setRol(p.getJugador().getRol());
                jDto.setEquipoLec(p.getJugador().getEquipoLec() != null ? p.getJugador().getEquipoLec().getNombre() : "S/E");
                jDto.setPrecioBase(p.getJugador().getPrecioBase() != null ? p.getJugador().getPrecioBase() : 0.0);
            }
            jDto.setEstado(p.getEstado() != null ? p.getEstado().name() : "BANQUILLO");
            return jDto;
        }).collect(Collectors.toList());

        dto.setJugadores(jugadores);
        return dto;
    }

    public List<RankingDTO> obtenerRanking(Long ligaId) {
        List<Equipo> equipos = equipoRepository.findAllByLigaIdOrderByPuntuacionTotalDesc(ligaId);

        return equipos.stream().map(e -> {
            RankingDTO dto = new RankingDTO();
            dto.setEquipoId(e.getId());
            dto.setNombreUsuario(e.getUsuario().getNickname());
            dto.setPuntosTotales(e.getPuntuacionTotal());
            return dto;
        }).collect(Collectors.toList());
    }
}
