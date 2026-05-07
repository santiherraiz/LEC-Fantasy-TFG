export interface EquipoLec {
  id: number;
  nombre: string;
  abreviatura: string;
  logoUrl: string;
}

export interface Jugador {
  id: number;
  nombreReal: string;
  nickname: string;
  rol: string;
  equipoLec: EquipoLec;
  precioBase: number;
  imagenUrl: string | null;
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

export interface Subasta {
  id: number;
  jugador: Jugador;
  fechaFin: string;
  miPuja: number | null;
}

export interface CatalogoJugador {
  jugador: Jugador;
  propietarioNickname: string | null;
  puntosMedia: number;
  puntosTotales: number;
}

export interface EquipoRivalDTO {
  id: number;
  nombreUsuario: string;
  presupuesto: number;
  puntosTotales: number;
  jugadores: JugadorRival[];
}

export interface JugadorRival {
  id: number;
  nickname: string;
  foto: string | null;
  rol: string;
  equipoLec: string;
  precioBase: number;
  estado: "TITULAR" | "BANQUILLO";
}

export interface JugadorDetalleDTO {
  id: number;
  nombreReal: string;
  nickname: string;
  rol: string;
  precioBase: number;
  imagenUrl: string | null;
  equipoLecNombre: string | null;
  equipoLecLogo: string | null;
  propietarioNickname: string | null;
  propietarioEquipoId: number | null;
}

