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

    @Column(name = "ultima_actualizacion_real")
    private LocalDateTime ultimaActualizacionReal;
}
