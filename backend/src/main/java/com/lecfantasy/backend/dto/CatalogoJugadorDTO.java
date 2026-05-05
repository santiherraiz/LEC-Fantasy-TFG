package com.lecfantasy.backend.dto;

import com.lecfantasy.backend.entity.Jugador;
import lombok.Data;

@Data
public class CatalogoJugadorDTO {
    private Jugador jugador;
    private String propietarioNickname; // Nickname del usuario que lo tiene, o null si está libre
    private Double puntosMedia;
}
