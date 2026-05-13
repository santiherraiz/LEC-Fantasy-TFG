package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "historico_alineaciones")
@Data
public class HistoricoAlineacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jugador_id", nullable = false)
    private Jugador jugador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jornada_id", nullable = false)
    private Jornada jornada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAlineacion estado; // TITULAR o BANQUILLO

    @Column(name = "puntos_semanales", nullable = false)
    private Double puntosSemanales = 0.0;
    }