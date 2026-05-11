package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class JugadorDetalleDTO {
    private Long id;
    private String nombreReal;
    private String nickname;
    private String rol;
    private Double precioBase;
    private Double precioActual;
    private String tendencia;
    private String imagenUrl;
    private String equipoLecNombre;
    private String equipoLecLogo;
    
    // Información de propiedad
    private String propietarioNickname;
    private Long propietarioEquipoId;
}
