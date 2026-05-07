package com.lecfantasy.backend.dto;

import com.lecfantasy.backend.entity.Jugador;
import lombok.Data;

@Data
public class CatalogoJugadorDTO {
    private Jugador jugador;
    private String propietarioNickname;
    private double puntosMedia;
    private double puntosTotales;
}
