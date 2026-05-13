package com.lecfantasy.backend.dto;

import com.lecfantasy.backend.entity.Jugador;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubastaDTO {
    private Long id;
    private Jugador jugador;
    private LocalDateTime fechaFin;
    private Long segundosRestantes; // Segundos hasta el fin de la subasta
    private Double miPuja; // Cantidad pujada por el usuario actual
}
