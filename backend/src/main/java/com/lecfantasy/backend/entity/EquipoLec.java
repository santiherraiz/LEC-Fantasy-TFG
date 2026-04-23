package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "equipos_lec")
@Data
public class EquipoLec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(name = "abreviatura", length = 5)
    private String abreviatura;

    @Column(name = "logo_url")
    private String logoUrl;
}
