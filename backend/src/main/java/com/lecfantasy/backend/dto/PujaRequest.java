package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class PujaRequest {
    private Long subastaId;
    private Long usuarioId;
    private Double cantidad;
}
