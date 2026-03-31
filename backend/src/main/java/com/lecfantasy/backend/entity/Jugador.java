package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "jugadores")
@Data
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_real", nullable = false)
    private String nombreReal;

    @Column(nullable = false, unique = true)
    private String nickname; // Ej: "Caps", "Razork", "Elyoya"

    @Column(nullable = false)
    private String rol; // TOP, JGL, MID, ADC, SUP

    @Column(name = "precio_base", nullable = false)
    private Double precioBase; // Lo que cuesta ficharlo al principio
}