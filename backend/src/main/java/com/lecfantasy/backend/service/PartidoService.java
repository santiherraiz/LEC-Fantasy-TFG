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

    public List<JornadaCalendarioDTO> obtenerCalendario() {
        List<Partido> partidos = partidoRepository.findAll();

        List<Partido> partidosFiltrados = partidos.stream()
                .filter(p -> p.getJornada() != null && p.getFechaUtc() != null)
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

                // Agrupar por serieId para calcular el resultado global (2-0, 2-1)
                Map<String, List<Partido>> porSerie = partidosDia.stream()
                        .collect(Collectors.groupingBy(p -> p.getSerieId() != null ? p.getSerieId() : p.getGameId()));

                List<PartidoCalendarioDTO> partidoDTOs = porSerie.values().stream()
                        .map(serie -> {
                            // Primer partido para información básica
                            Partido p1 = serie.stream()
                                    .sorted(Comparator.comparing(Partido::getFechaUtc))
                                    .findFirst()
                                    .orElseThrow();

                            PartidoCalendarioDTO dto = convertToDTO(p1);

                            // Calcular scores
                            int t1Wins = (int) serie.stream().filter(p -> p1.getTeam1().equals(p.getWinTeam())).count();
                            int t2Wins = (int) serie.stream().filter(p -> p1.getTeam2().equals(p.getWinTeam())).count();

                            dto.setTeam1Score(t1Wins);
                            dto.setTeam2Score(t2Wins);

                            // Determinar ganador de la serie si ha terminado
                            // Si es Bo3 (serie.size() > 1 o detectado por serieId), se necesitan 2 victorias
                            // Si es Bo1, basta con 1 victoria
                            if (t1Wins > t2Wins)
                                dto.setWinTeam(p1.getTeam1());
                            else if (t2Wins > t1Wins)
                                dto.setWinTeam(p1.getTeam2());
                            else
                                dto.setWinTeam(null);

                            return dto;
                        })
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
