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

    @ManyToOne
    @JoinColumn(name = "team1_id")
    private EquipoLec team1Entity;

    @ManyToOne
    @JoinColumn(name = "team2_id")
    private EquipoLec team2Entity;

    @ManyToOne
    @JoinColumn(name = "win_team_id")
    private EquipoLec winTeamEntity;

    @ManyToOne
    @JoinColumn(name = "loss_team_id")
    private EquipoLec lossTeamEntity;

    @Column(name = "fecha_utc")
    private java.time.LocalDateTime fechaUtc;

    @ManyToOne
    @JoinColumn(name = "jornada_id")
    private Jornada jornada;

    @Column(name = "serie_id")
    private String serieId;

    @Column(name = "puntos_calculados", nullable = false)
    private boolean puntosCalculados = false;

    @Column(name = "estadisticas_importadas", nullable = false)
    private boolean estadisticasImportadas = false;
}