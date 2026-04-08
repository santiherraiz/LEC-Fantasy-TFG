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

        @JsonProperty("Team1")
        private String team1;

        @JsonProperty("Team2")
        private String team2;

        @JsonProperty("WinTeam")
        private String winTeam;

        @JsonProperty("LossTeam")
        private String lossTeam;

        @JsonProperty("dateTimeUtc")
        private String dateTimeUtc;
    }
}