package com.lecfantasy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class EquipoDetalleDTO {
    private Long equipoId;
    private String nombreEquipo;
    private Double presupuestoDisponible;
    private Long puntuacionTotal;

    // Una lista con los datos resumidos de los jugadores
    private List<JugadorEnPlantillaDTO> jugadores;

    @Data
    public static class JugadorEnPlantillaDTO {
        private Long idJugador;
        private String nickname;
        private String rol;
        private String estado; // "TITULAR" o "BANQUILLO"
    }
}