package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_demo")
@Data
public class ConfiguracionDemo {
    @Id
    private Long id = 1L; // Solo habrá una fila

    @Column(name = "modo_demo_activo")
    private boolean modoDemoActivo = false;

    @Column(name = "fecha_simulada")
    private LocalDateTime fechaSimulada;

    // Campos de backup para el "Universo Paralelo"
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "demo_backup_presupuestos", joinColumns = @JoinColumn(name = "config_id"))
    @MapKeyColumn(name = "equipo_id")
    @Column(name = "presupuesto")
    private java.util.Map<Long, Double> backupPresupuestos = new java.util.HashMap<>();
}
