package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class CatalogoJugadorDTO {
    private Long id;
    private String nickname;
    private String rol;
    private Double precioActual;
    private String tendencia;
    private String imagenUrl;
    private String equipoLecNombre;
    private String equipoLecLogo;
    private String propietarioNickname;
    private double puntosMedia;
    private double puntosTotales;
}
