package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class RankingDTO {
    private Long equipoId;
    private String nombreUsuario; // Nickname del usuario
    private Double puntosTotales;
}
