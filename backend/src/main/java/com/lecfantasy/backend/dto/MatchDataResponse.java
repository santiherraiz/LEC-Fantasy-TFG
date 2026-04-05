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
        @JsonProperty("Name")
        private String nickname; // El ID/Nickname del jugador
        @JsonProperty("Kills")
        private int kills;
        @JsonProperty("Deaths")
        private int deaths;
        @JsonProperty("Assists")
        private int assists;
        @JsonProperty("CS")
        private int cs;
    }
}