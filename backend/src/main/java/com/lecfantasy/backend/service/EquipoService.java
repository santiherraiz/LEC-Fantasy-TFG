package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.EquipoDetalleDTO;
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

    public EquipoDetalleDTO obtenerDetalleEquipo(Long usuarioId) {
        // 1. Buscamos el equipo
        Equipo equipo = equipoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("El usuario no tiene un equipo creado."));

        // 2. Buscamos sus jugadores
        List<Plantilla> plantillas = plantillaRepository.findByEquipoId(equipo.getId());

        // 3. Montamos la respuesta limpia (DTO)
        EquipoDetalleDTO respuesta = new EquipoDetalleDTO();
        respuesta.setNombreEquipo(equipo.getNombreEquipo());
        respuesta.setPresupuestoDisponible(equipo.getPresupuestoDisponible());
        respuesta.setPuntuacionTotal(equipo.getPuntuacionTotal());

        // Transformamos la lista de la base de datos a la lista del DTO
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
}