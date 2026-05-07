package com.lecfantasy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class EquipoRivalDTO {
    private Long id;
    private String nombreUsuario;
    private double presupuesto;
    private double puntosTotales;
    private List<JugadorEnEquipoDTO> jugadores;

    @Data
    public static class JugadorEnEquipoDTO {
        private Long id;
        private String nickname;
        private String foto;
        private String rol;
        private String equipoLec;
        private double precioBase;
        private String estado; // TITULAR o BANQUILLO
    }
}
