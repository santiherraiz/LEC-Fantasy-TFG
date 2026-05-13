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
  precioActual: number;
  tendencia: string;
  imagenUrl: string | null;
}

export interface JugadorEnPlantillaDTO {
  idJugador: number;
  nickname: string;
  rol: string;
  estado: "TITULAR" | "BANQUILLO";
  imagenUrl: string | null;
  precio: number;
  equipoLec: string;
  puntos: number;
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
  team1Logo?: string;
  team2Logo?: string;
  jugadorEquipo?: string;
  fecha: string;
  semana: number;
  serieId: string;
  resultado?: "WIN" | "LOSS";
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  puntosGenerados: number;
  puntosReales: number;
}

export interface Subasta {
  id: number;
  jugador: Jugador;
  fechaFin: any;
  miPuja: number | null;
}

export interface CatalogoJugador {
  id: number;
  nickname: string;
  rol: string;
  precioActual: number;
  tendencia: string;
  imagenUrl: string | null;
  equipoLecNombre: string | null;
  equipoLecLogo: string | null;
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
  precioActual: number;
  tendencia: string;
  estado: "TITULAR" | "BANQUILLO";
}

export interface JugadorDetalleDTO {
  id: number;
  nombreReal: string;
  nickname: string;
  rol: string;
  precioBase: number;
  precioActual: number;
  tendencia: string;
  imagenUrl: string | null;
  equipoLecNombre: string | null;
  equipoLecLogo: string | null;
  propietarioNickname: string | null;
  propietarioEquipoId: number | null;
}

export type TipoNoticia = 
  | "FICHAJE" 
  | "CLAUSULAZO" 
  | "VENTA" 
  | "RESULTADO_JORNADA" 
  | "SUBASTA_GANADA" 
  | "NUEVA_LIGA";

export interface NoticiaLiga {
  id: number;
  tipoNoticia: TipoNoticia;
  mensaje: string;
  fecha: string;
  jugadorId: number | null;
  equipoId: number | null;
  imagenUrl: string | null;
}

export interface PartidoCalendario {
  gameId: string;
  team1: string;
  team2: string;
  team1Abrev: string;
  team2Abrev: string;
  team1Logo: string;
  team2Logo: string;
  fecha: string;
  winTeam: string | null;
  team1Score?: number;
  team2Score?: number;
}

export interface DiaCalendario {
  fecha: string;
  partidos: PartidoCalendario[];
}

export interface JornadaCalendario {
  semana: number;
  dias: DiaCalendario[];
}

export interface JugadorPuntosDTO {
  idJugador: number;
  nickname: string;
  rol: string;
  imagenUrl: string | null;
  puntosSemanales: number;
  equipoLec: string;
}

export interface EquipoJornadaDTO {
  equipoId: number;
  nombreEquipo: string;
  nombreUsuario: string;
  puntosTotalesJornada: number;
  jugadores: JugadorPuntosDTO[];
}

export interface Jornada {
  id: number;
  numeroSemana: number;
  estado: "PROGRAMADA" | "BLOQUEADA" | "PROCESANDO" | "FINALIZADA";
  fechaInicio: string;
  fechaFin: string;
}

