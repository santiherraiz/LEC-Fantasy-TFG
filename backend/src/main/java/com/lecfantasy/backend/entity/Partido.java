package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "partidos")
public class Partido {

    @Id // Usamos el GameId de Leaguepedia como identificador único
    private String gameId;

    private String team1;
    private String team2;
    private String winTeam;
    private String lossTeam;

    @Column(name = "fecha_utc")
    private String fechaUtc;

    @Column(name = "puntos_calculados", nullable = false)
    private boolean puntosCalculados = false;
}