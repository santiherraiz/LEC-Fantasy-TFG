package com.lecfantasy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class EquipoJornadaDTO {
    private Long equipoId;
    private String nombreEquipo;
    private String nombreUsuario;
    private Double puntosTotalesJornada;
    private List<JugadorPuntosDTO> jugadores;

    @Data
    public static class JugadorPuntosDTO {
        private Long idJugador;
        private String nickname;
        private String rol;
        private String imagenUrl;
        private Double puntosSemanales;
        private String equipoLec;
    }
}
