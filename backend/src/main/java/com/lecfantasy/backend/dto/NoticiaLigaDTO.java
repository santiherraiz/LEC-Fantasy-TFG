package com.lecfantasy.backend.dto;

import com.lecfantasy.backend.entity.TipoNoticia;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NoticiaLigaDTO {
    private Long id;
    private TipoNoticia tipoNoticia;
    private String mensaje;
    private LocalDateTime fecha;
    private Long jugadorId;
    private Long equipoId;
    private String imagenUrl;
}
