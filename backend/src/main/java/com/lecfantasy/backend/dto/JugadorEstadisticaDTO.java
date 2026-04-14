package com.lecfantasy.backend.dto;

import lombok.Data;

@Data
public class JugadorEstadisticaDTO {
    private String gameId;
    private String matchName; // e.g., "G2 vs Fnatic"
    private String fecha;
    private Integer semana;
    private String serieId;
    private String resultado; // "WIN" o "LOSS"
    private int kills;
    private int deaths;
    private int assists;
    private int cs;
    private Long puntosGenerados;
}
