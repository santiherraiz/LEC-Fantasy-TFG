package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "plantillas")
@Data
public class Plantilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- RELACIÓN CON EL EQUIPO ---
    @ManyToOne
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    // --- RELACIÓN CON EL JUGADOR ---
    @ManyToOne
    @JoinColumn(name = "jugador_id", nullable = false)
    private Jugador jugador;

    // --- DATOS EXTRAS DE ESTA UNIÓN ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAlineacion estado; // Guardará "TITULAR" o "BANQUILLO"
}