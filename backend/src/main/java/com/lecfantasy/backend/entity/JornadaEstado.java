package com.lecfantasy.backend.entity;

public enum JornadaEstado {
    PROGRAMADA,   // La jornada aún no ha empezado, los usuarios pueden alinear
    BLOQUEADA,    // El snapshot se ha realizado, la jornada está en juego
    PROCESANDO,   // Los partidos han terminado, estamos importando estadísticas
    FINALIZADA    // Puntos calculados y jornada cerrada
}
