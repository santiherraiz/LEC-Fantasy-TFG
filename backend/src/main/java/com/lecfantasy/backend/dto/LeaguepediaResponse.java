package com.lecfantasy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class LeaguepediaResponse {

    // Atrapa el array principal que manda Leaguepedia
    private List<CargoItem> cargoquery;

    @Data
    public static class CargoItem {
        private PlayerTitle title;
    }

    @Data
    public static class PlayerTitle {
        @JsonProperty("Name")
        private String name;

        @JsonProperty("ID")
        private String id; // Este será nuestro Nickname

        @JsonProperty("Role")
        private String role;

        @JsonProperty("Team")
        private String team;

        @JsonProperty("OverviewPage")
        private String overviewPage;
    }
}