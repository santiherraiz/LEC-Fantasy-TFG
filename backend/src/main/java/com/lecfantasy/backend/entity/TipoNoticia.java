package com.lecfantasy.backend.entity;

public enum TipoNoticia {
    FICHAJE,            // Un jugador ha sido fichado directamente o por subasta
    CLAUSULAZO,         // Un jugador ha sido robado pagando su cláusula
    VENTA,              // Un jugador ha sido vendido al mercado
    RESULTADO_JORNADA,  // Resumen o finalización de una jornada
    SUBASTA_GANADA,     // Alguien ha ganado una subasta
    NUEVA_LIGA          // Creación de la liga (bienvenida)
}
