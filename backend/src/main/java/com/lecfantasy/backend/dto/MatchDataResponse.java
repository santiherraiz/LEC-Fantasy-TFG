package com.lecfantasy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class MatchDataResponse {
    private List<CargoItem> cargoquery;

    @Data
    public static class CargoItem {
        private MatchStats title;
    }

    @Data
    public static class MatchStats {
        @JsonProperty("GameId")
        private String gameId;

        @JsonProperty("Name")
        private String nickname; // El ID/Nickname del jugador
        @JsonProperty("Kills")
        private String kills;
        @JsonProperty("Deaths")
        private String deaths;
        @JsonProperty("Assists")
        private String assists;
        @JsonProperty("CS")
        private String cs;
    }
}