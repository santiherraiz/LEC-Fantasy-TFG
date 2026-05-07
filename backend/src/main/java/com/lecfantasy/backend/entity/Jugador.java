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
    private String nickname;

    @Column(nullable = false)
    private String rol;

    @Column(name = "precio_base", nullable = false)
    private Double precioBase;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @ManyToOne
    @JoinColumn(name = "equipo_lec_id")
    private EquipoLec equipoLec;
}