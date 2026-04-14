package com.lecfantasy.backend.dto;

import com.lecfantasy.backend.entity.Jugador;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JugadorPuntuacionTotalDTO {
    private Jugador jugador;
    private Long puntosTotales;
}
