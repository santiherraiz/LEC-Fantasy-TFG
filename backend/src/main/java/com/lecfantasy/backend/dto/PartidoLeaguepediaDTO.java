package com.lecfantasy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class PartidoLeaguepediaDTO {
    private List<CargoItem> cargoquery;

    @Data
    public static class CargoItem {
        private PartidoData title;
    }

    @Data
    public static class PartidoData {
        @JsonProperty("GameId")
        private String gameId;

        @JsonProperty("Tournament")
        private String tournament;

        @JsonProperty("Team1")
        private String team1;

        @JsonProperty("Team2")
        private String team2;

        @JsonProperty("Team1Score")
        private String team1Score;

        @JsonProperty("Team2Score")
        private String team2Score;

        @JsonProperty("WinTeam")
        private String winTeam;

        @JsonProperty("LossTeam")
        private String lossTeam;

        @JsonProperty("DateTime_UTC")
        private String dateTimeUtc;
    }
}