package com.lecfantasy.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class DiaCalendarioDTO {
    private LocalDate fecha;
    private List<PartidoCalendarioDTO> partidos;
}
