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

    @ManyToOne
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    @ManyToOne
    @JoinColumn(name = "jugador_id", nullable = false)
    private Jugador jugador;

    @Column(nullable = false)
    private Integer semana;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAlineacion estado; // TITULAR o BANQUILLO
}