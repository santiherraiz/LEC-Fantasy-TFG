package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "jornadas")
@Data
public class Jornada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_semana", nullable = false, unique = true)
    private Integer numeroSemana;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JornadaEstado estado = JornadaEstado.PROGRAMADA;

    @Column(name = "snapshot_realizado", nullable = false)
    private boolean snapshotRealizado = false;

    @Column(name = "puntos_calculados", nullable = false)
    private boolean puntosCalculados = false;
}
