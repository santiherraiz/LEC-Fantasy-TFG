package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.EquipoDetalleDTO;
import com.lecfantasy.backend.dto.RankingDTO;
import com.lecfantasy.backend.dto.EquipoRivalDTO;
import com.lecfantasy.backend.dto.EquipoJornadaDTO;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.entity.HistoricoAlineacion;
import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import com.lecfantasy.backend.repository.JornadaRepository;
import com.lecfantasy.backend.repository.HistoricoAlineacionRepository;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private JornadaRepository jornadaRepository;

    @Autowired
    private HistoricoAlineacionRepository historicoAlineacionRepository;

    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

    @Transactional(readOnly = true)
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
                dto.setEquipoLec(p.getJugador().getEquipoLec() != null ? p.getJugador().getEquipoLec().getNombre() : "S/E");
                dto.setPuntos(estadisticaPartidoRepository.sumPuntosByJugadorId(p.getJugador().getId()));
            }
            dto.setEstado(p.getEstado() != null ? p.getEstado().name() : EstadoAlineacion.BANQUILLO.name());
            return dto;
        }).collect(Collectors.toList());

        respuesta.setJugadores(jugadoresDTO);
        return respuesta;
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public EquipoJornadaDTO obtenerDetalleEquipoJornada(Long equipoId, Long jornadaId) {
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
        
        Jornada jornada = jornadaRepository.findById(jornadaId)
                .orElseThrow(() -> new RuntimeException("Jornada no encontrada"));

        List<HistoricoAlineacion> historicos = historicoAlineacionRepository.findByEquipoIdAndJornada(equipoId, jornada);

        EquipoJornadaDTO dto = new EquipoJornadaDTO();
        dto.setEquipoId(equipo.getId());
        dto.setNombreEquipo(equipo.getNombreEquipo());
        dto.setNombreUsuario(equipo.getUsuario().getNickname());

        List<EquipoJornadaDTO.JugadorPuntosDTO> jugadores = historicos.stream()
                .filter(h -> h.getEstado() == EstadoAlineacion.TITULAR)
                .map(h -> {
                    EquipoJornadaDTO.JugadorPuntosDTO jDto = new EquipoJornadaDTO.JugadorPuntosDTO();
                    jDto.setIdJugador(h.getJugador().getId());
                    jDto.setNickname(h.getJugador().getNickname());
                    jDto.setRol(h.getJugador().getRol());
                    jDto.setImagenUrl(h.getJugador().getImagenUrl());
                    jDto.setPuntosSemanales(h.getPuntosSemanales());
                    jDto.setEquipoLec(h.getJugador().getEquipoLec() != null ? h.getJugador().getEquipoLec().getNombre() : "S/E");
                    return jDto;
                }).collect(Collectors.toList());

        dto.setJugadores(jugadores);
        dto.setPuntosTotalesJornada(jugadores.stream().mapToDouble(EquipoJornadaDTO.JugadorPuntosDTO::getPuntosSemanales).sum());

        return dto;
    }

    @Transactional(readOnly = true)
    public List<RankingDTO> obtenerRanking(Long ligaId, Long jornadaId) {
        if (jornadaId != null) {
            List<Object[]> resultados = historicoAlineacionRepository.findRankingByJornada(ligaId, jornadaId);
            return resultados.stream().map(r -> {
                RankingDTO dto = new RankingDTO();
                dto.setEquipoId((Long) r[0]);
                dto.setNombreUsuario((String) r[1]);
                dto.setPuntosTotales((Double) r[2]);
                return dto;
            }).collect(Collectors.toList());
        }

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
