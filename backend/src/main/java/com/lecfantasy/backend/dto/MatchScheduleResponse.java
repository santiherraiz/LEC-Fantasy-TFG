package com.lecfantasy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class MatchScheduleResponse {
    private List<CargoItem> cargoquery;

    @Data
    public static class CargoItem {
        private MatchScheduleData title;
    }

    @Data
    public static class MatchScheduleData {
        @JsonProperty("Team1")
        private String team1;
        @JsonProperty("Team2")
        private String team2;
        @JsonProperty("DateTime UTC")
        private String dateTimeUtc;
        @JsonProperty("GameId")
        private String gameId; // Se usa el GameId para extraer la semana en ScoreboardGames
        @JsonProperty("MatchId")
        private String matchId;
    }
}
