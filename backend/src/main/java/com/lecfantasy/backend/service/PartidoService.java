package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.DiaCalendarioDTO;
import com.lecfantasy.backend.dto.JornadaCalendarioDTO;
import com.lecfantasy.backend.dto.PartidoCalendarioDTO;
import com.lecfantasy.backend.entity.Partido;
import com.lecfantasy.backend.repository.PartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PartidoService {

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private ClockService clockService;

    public List<JornadaCalendarioDTO> obtenerCalendario() {
        boolean esDemo = clockService.isModoDemoActivo();
        List<Partido> partidos = partidoRepository.findAll();
        
        // Filtrar por modo: En demo solo queremos semanas > 10, en normal semanas <= 10
        // (Basado en la convención que parece seguir el proyecto para separar demo de real)
        List<Partido> partidosFiltrados = partidos.stream()
                .filter(p -> p.getJornada() != null)
                .filter(p -> {
                    int semana = p.getJornada().getNumeroSemana();
                    return esDemo ? semana > 10 : semana <= 10;
                })
                .collect(Collectors.toList());

        Map<Integer, List<Partido>> porSemana = partidosFiltrados.stream()
                .collect(Collectors.groupingBy(p -> p.getJornada().getNumeroSemana()));

        List<JornadaCalendarioDTO> resultado = new ArrayList<>();

        porSemana.forEach((semana, partidosSemana) -> {
            JornadaCalendarioDTO jornadaDTO = new JornadaCalendarioDTO();
            jornadaDTO.setSemana(semana);

            // Agrupar por día
            Map<java.time.LocalDate, List<Partido>> porDia = partidosSemana.stream()
                    .collect(Collectors.groupingBy(p -> p.getFechaUtc().toLocalDate()));

            List<DiaCalendarioDTO> dias = new ArrayList<>();
            porDia.forEach((fecha, partidosDia) -> {
                DiaCalendarioDTO diaDTO = new DiaCalendarioDTO();
                diaDTO.setFecha(fecha);
                
                // Agrupar por serieId para mostrar solo el primer mapa de una serie (o el primero del día si no hay serie)
                // En LEC normalmente son Bo1 o Bo3. Si es Bo3 queremos la hora de inicio del primero.
                Collection<Partido> partidosUnicos = partidosDia.stream()
                        .collect(Collectors.toMap(
                                p -> p.getSerieId() != null ? p.getSerieId() : p.getGameId(),
                                p -> p,
                                (p1, p2) -> p1.getFechaUtc().isBefore(p2.getFechaUtc()) ? p1 : p2
                        )).values();

                List<PartidoCalendarioDTO> partidoDTOs = partidosUnicos.stream()
                        .map(this::convertToDTO)
                        .sorted(Comparator.comparing(PartidoCalendarioDTO::getFecha))
                        .collect(Collectors.toList());
                
                diaDTO.setPartidos(partidoDTOs);
                dias.add(diaDTO);
            });

            dias.sort(Comparator.comparing(DiaCalendarioDTO::getFecha));
            jornadaDTO.setDias(dias);
            resultado.add(jornadaDTO);
        });

        resultado.sort(Comparator.comparing(JornadaCalendarioDTO::getSemana));
        return resultado;
    }

    private PartidoCalendarioDTO convertToDTO(Partido p) {
        PartidoCalendarioDTO dto = new PartidoCalendarioDTO();
        dto.setGameId(p.getGameId());
        dto.setTeam1(p.getTeam1());
        dto.setTeam2(p.getTeam2());
        dto.setFecha(p.getFechaUtc());
        dto.setWinTeam(p.getWinTeam());
        
        if (p.getTeam1Entity() != null) {
            dto.setTeam1Abrev(p.getTeam1Entity().getAbreviatura());
            dto.setTeam1Logo(p.getTeam1Entity().getLogoUrl());
        }
        
        if (p.getTeam2Entity() != null) {
            dto.setTeam2Abrev(p.getTeam2Entity().getAbreviatura());
            dto.setTeam2Logo(p.getTeam2Entity().getLogoUrl());
        }
        
        return dto;
    }
}
