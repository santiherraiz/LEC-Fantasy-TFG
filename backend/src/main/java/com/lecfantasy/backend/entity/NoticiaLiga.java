package com.lecfantasy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "noticias_liga")
@Data
public class NoticiaLiga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "liga_id", nullable = false)
    private Liga liga;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_noticia", nullable = false)
    private TipoNoticia tipoNoticia;

    @Column(nullable = false, length = 1000)
    private String mensaje;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "jugador_id")
    private Long jugadorId;

    @Column(name = "equipo_id")
    private Long equipoId;

    @Column(name = "imagen_url")
    private String imagenUrl;
}
