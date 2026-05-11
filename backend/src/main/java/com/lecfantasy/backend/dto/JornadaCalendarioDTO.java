package com.lecfantasy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class JornadaCalendarioDTO {
    private Integer semana;
    private List<DiaCalendarioDTO> dias;
}
