package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "estadisticas_partidos")
@Data
public class EstadisticaPartido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "partido_id", nullable = false)
    private Partido partido;

    @ManyToOne
    @JoinColumn(name = "jugador_id", nullable = false)
    private Jugador jugador;

    @Column(nullable = false)
    private Integer kills;

    @Column(nullable = false)
    private Integer deaths;

    @Column(nullable = false)
    private Integer assists;

    @Column(nullable = false)
    private Integer cs;

    @Column(nullable = false)
    private Integer gold;

    @Column(name = "puntos_generados", nullable = false)
    private Double puntosGenerados;

    @Column(name = "puntos_reales", nullable = false)
    private Double puntosReales = 0.0;
}
