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

        @JsonProperty("Link")
        private String nickname; // El ID/Nickname del jugador
        @JsonProperty("Team")
        private String team;
        @JsonProperty("Kills")
        private String kills;
        @JsonProperty("Deaths")
        private String deaths;
        @JsonProperty("Assists")
        private String assists;
        @JsonProperty("CS")
        private String cs;
        @JsonProperty("Gold")
        private String gold;
        @JsonProperty("DamageToChampions")
        private String damageToChampions;
        @JsonProperty("VisionScore")
        private String visionScore;
        @JsonProperty("DamageTaken")
        private String damageTaken;
        @JsonProperty("Pentakills")
        private String pentaKills;
    }
}