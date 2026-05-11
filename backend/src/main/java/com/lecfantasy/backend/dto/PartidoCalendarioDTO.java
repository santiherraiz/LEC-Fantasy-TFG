package com.lecfantasy.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PartidoCalendarioDTO {
    private String gameId;
    private String team1;
    private String team2;
    private String team1Abrev;
    private String team2Abrev;
    private String team1Logo;
    private String team2Logo;
    private LocalDateTime fecha;
    private String winTeam;
}
