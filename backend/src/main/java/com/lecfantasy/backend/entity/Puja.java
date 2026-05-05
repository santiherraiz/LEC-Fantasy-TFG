package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "pujas")
@Data
public class Puja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subasta_id", nullable = false)
    private Subasta subasta;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private Double cantidad;

    @Column(name = "fecha_puja", nullable = false)
    private LocalDateTime fechaPuja;
}
