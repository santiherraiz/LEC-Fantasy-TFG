package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "ligas")
@Data
public class Liga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String codigoAcceso;

    @ManyToOne
    @JoinColumn(name = "admin_id", referencedColumnName = "id")
    private Usuario administrador;

    @PrePersist
    public void generateCodigo() {
        if (this.codigoAcceso == null) {
            this.codigoAcceso = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
