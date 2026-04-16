export interface Jugador {
  id: number;
  nombreReal: string;
  nickname: string;
  rol: string;
  equipoLec: string;
  precioBase: number;
}

export interface JugadorEnPlantillaDTO {
  idJugador: number;
  nickname: string;
  rol: string;
  estado: "TITULAR" | "BANQUILLO";
}

export interface EquipoDetalleDTO {
  equipoId: number; // CRITICAL: This was missing or typed as string
  nombreEquipo: string;
  presupuestoDisponible: number;
  puntuacionTotal: number;
  jugadores: JugadorEnPlantillaDTO[];
}

export interface RankingEntry {
  equipoId: number;
  nombreUsuario: string;
  puntosTotales: number;
}

export interface JugadorPuntuacionTotal {
  jugador: Jugador;
  puntosTotales: number;
}

export interface JugadorEstadistica {
  gameId: string;
  matchName: string;
  team1?: string;
  team2?: string;
  fecha: string;
  semana: number;
  serieId: string;
  resultado?: "WIN" | "LOSS";
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  puntosGenerados: number;
}
