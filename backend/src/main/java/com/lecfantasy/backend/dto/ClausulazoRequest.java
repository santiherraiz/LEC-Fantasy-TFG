package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class ClausulazoRequest {
    private Long compradorUsuarioId;
    private Long jugadorId;
    private Long ligaId;
}
