package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class MarketActionRequest {
    private Long equipoId;
    private Long jugadorId;
    private Long usuarioId;
    private Long ligaId;
    private Long subastaId;
    private Double cantidad;
}
