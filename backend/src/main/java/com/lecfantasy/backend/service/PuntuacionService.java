package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.MatchDataResponse;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.EstadisticaPartido;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.entity.Partido;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.entity.HistoricoAlineacion;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.HistoricoAlineacionRepository;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.PartidoRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class PuntuacionService {

    @Autowired
    private PlantillaRepository plantillaRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private PartidoRepository partidoRepository;

    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private HistoricoAlineacionRepository historicoAlineacionRepository;

    @Transactional
    public void hacerSnapshotSemana(int semana) {
        System.out.println("📸 Realizando snapshot para la semana " + semana);

        // Opcional: Borrar snapshot previo si existe para esta semana
        List<HistoricoAlineacion> previo = historicoAlineacionRepository.findBySemana(semana);
        if (!previo.isEmpty()) {
            historicoAlineacionRepository.deleteAll(previo);
        }

        List<Plantilla> todasLasPlantillas = plantillaRepository.findAll();
        for (Plantilla p : todasLasPlantillas) {
            HistoricoAlineacion h = new HistoricoAlineacion();
            h.setEquipo(p.getEquipo());
            h.setJugador(p.getJugador());
            h.setSemana(semana);
            h.setEstado(p.getEstado());
            historicoAlineacionRepository.save(h);
        }
        System.out.println("✅ Snapshot completado: " + todasLasPlantillas.size() + " registros guardados.");
    }

    public void importarPartidosDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();
        String torneo = "LEC 2026 Spring";

        // Usamos UriComponentsBuilder para codificar correctamente los espacios y
        // comillas
        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery")
                .queryParam("format", "json")
                .queryParam("tables", "ScoreboardGames")
                .queryParam("fields", "Team1,Team2,WinTeam,LossTeam,DateTime_UTC,GameId")
                .queryParam("where", "Tournament='" + torneo + "'")
                .queryParam("limit", "500")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("🚀 Importando partidos de Leaguepedia para: " + torneo);
            System.out.println("URL de consulta: " + url);

            ResponseEntity<String> responseRaw = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            System.out.println("DEBUG API Response: " + responseRaw.getBody());

            if (responseRaw.getBody() == null || responseRaw.getBody().contains("\"error\"")) {
                System.err.println("❌ Fandom devolvió un error en la respuesta.");
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            PartidoLeaguepediaDTO body = mapper.readValue(responseRaw.getBody(), PartidoLeaguepediaDTO.class);

            if (body != null && body.getCargoquery() != null && !body.getCargoquery().isEmpty()) {
                System.out.println("✅ Procesando " + body.getCargoquery().size() + " partidos...");
                for (PartidoLeaguepediaDTO.CargoItem item : body.getCargoquery()) {
                    PartidoLeaguepediaDTO.PartidoData data = item.getTitle();
                    if (data.getGameId() == null)
                        continue;

                    Optional<Partido> partidoOpt = partidoRepository.findById(data.getGameId());
                    Partido partido = partidoOpt.orElse(new Partido());
                    if (partidoOpt.isEmpty()) {
                        partido.setGameId(data.getGameId());
                        partido.setPuntosCalculados(false);
                    }

                    partido.setTeam1(data.getTeam1());
                    partido.setTeam2(data.getTeam2());
                    partido.setWinTeam(data.getWinTeam());
                    partido.setLossTeam(data.getLossTeam());
                    partido.setFechaUtc(data.getDateTimeUtc());

                    // PARSEO MANUAL DESDE GameId (Ej: "LEC/2026 Season/Spring Season_Week 1_3_3")
                    String gid = data.getGameId();

                    // 1. SerieId: Agrupamos mapas del mismo Bo3
                    // Generalmente el último número después del _ es el mapa (1, 2 o 3)
                    String matchId = gid;
                    if (gid.contains("_")) {
                        matchId = gid.substring(0, gid.lastIndexOf("_"));
                    }
                    partido.setSerieId(matchId);

                    // 2. Semana: Lógica flexible para extraer el número de semana
                    int semanaNum = 1;
                    String gidLower = gid.toLowerCase();

                    if (gidLower.contains("week")) {
                        try {
                            // Buscamos el número justo después de "week " o "week"
                            int weekIdx = gidLower.indexOf("week");
                            String afterWeek = gid.substring(weekIdx + 4).trim();
                            StringBuilder sb = new StringBuilder();
                            for (char c : afterWeek.toCharArray()) {
                                if (Character.isDigit(c)) {
                                    sb.append(c);
                                } else if (sb.length() > 0) {
                                    break;
                                }
                            }
                            if (sb.length() > 0) {
                                semanaNum = Integer.parseInt(sb.toString());
                            }
                        } catch (Exception e) {
                            System.err.println("Error parseando semana de: " + gid);
                        }
                    } else {
                        // Fallback: si el GID empieza por número (ej: "1_2_1"), el primero es la semana
                        try {
                            String firstPart = gid.split("_")[0];
                            if (firstPart.matches("\\d+")) {
                                semanaNum = Integer.parseInt(firstPart);
                            }
                        } catch (Exception e) {
                        }
                    }

                    partido.setSemana(semanaNum);
                    System.out.println("  - Partido: " + gid + " -> Semana: " + semanaNum + ", Serie: " + matchId);

                    partidoRepository.save(partido);
                }
                System.out.println("Importación de partidos finalizada.");
            }
        } catch (Exception e) {
            System.err.println("Error crítico importando partidos: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public String crearDatosPruebaSemana1() {
        // 1. Buscamos o creamos un grupo de jugadores estrella
        String[][] playersData = {
                { "Caps", "Rasmus Winther", "Mid", "G2 Esports", "12000.0" },
                { "Hans Sama", "Steven Liv", "ADC", "G2 Esports", "11000.0" },
                { "BrokenBlade", "Sergen Çelik", "Top", "G2 Esports", "10000.0" },
                { "Mikyx", "Mihael Mehle", "Support", "G2 Esports", "9500.0" },
                { "Yike", "Martin Sundelin", "Jungle", "G2 Esports", "9000.0" },
                { "Razork", "Iván Martín", "Jungle", "Fnatic", "10500.0" },
                { "Humanoid", "Marek Brázda", "Mid", "Fnatic", "10500.0" }
        };

        List<Jugador> jugadores = new ArrayList<>();
        for (String[] d : playersData) {
            Jugador j = jugadorRepository.findByNickname(d[0]).orElseGet(() -> {
                Jugador nuevo = new Jugador();
                nuevo.setNickname(d[0]);
                nuevo.setNombreReal(d[1]);
                nuevo.setRol(d[2]);
                nuevo.setEquipoLec(d[3]);
                nuevo.setPrecioBase(Double.parseDouble(d[4]));
                return jugadorRepository.save(nuevo);
            });
            jugadores.add(j);
        }

        // 2. Creamos una serie Bo3 (2 mapas) para la Semana 1
        String matchId = "MOCK_G2_FNC_W1";
        for (int i = 1; i <= 2; i++) {
            String gameId = matchId + "_G" + i;
            if (!partidoRepository.existsById(gameId)) {
                Partido p = new Partido();
                p.setGameId(gameId);
                p.setTeam1("G2 Esports");
                p.setTeam2("Fnatic");
                p.setWinTeam("G2 Esports");
                p.setLossTeam("Fnatic");
                p.setSemana(1);
                p.setSerieId(matchId);
                partidoRepository.save(p);

                // Insertamos estadísticas para todos los jugadores del G2 en este partido
                for (Jugador j : jugadores) {
                    if (j.getEquipoLec().equals("G2 Esports")) {
                        EstadisticaPartido ep = new EstadisticaPartido();
                        ep.setPartido(p);
                        ep.setJugador(j);
                        ep.setKills(i == 1 ? 4 + (int) (Math.random() * 5) : 8 + (int) (Math.random() * 5));
                        ep.setDeaths((int) (Math.random() * 4));
                        ep.setAssists(10 + (int) (Math.random() * 10));
                        ep.setCs(250 + (int) (Math.random() * 100));

                        // Calculamos puntos de una vez para el seed
                        double pts = calcularPuntosPartido(ep.getKills(), ep.getDeaths(), ep.getAssists(), ep.getCs(),
                                true);
                        ep.setPuntosGenerados(Math.round(pts));
                        estadisticaPartidoRepository.save(ep);
                    }
                }
            }
        }

        return "✅ Datos de prueba creados para 7 jugadores y 1 partido Bo3. ¡Ya deberían aparecer puntos!";
    }

    private static final double PUNTOS_POR_KILL = 3.0;
    private static final double PUNTOS_POR_ASSIST = 1.5;
    private static final double PUNTOS_POR_DEATH = -1.0;
    private static final double PUNTOS_POR_CS = 0.02;
    private static final double PUNTOS_POR_VICTORIA = 5.0;

    public double calcularPuntosPartido(int kills, int deaths, int assists, int cs, boolean victoria) {
        double total = (kills * PUNTOS_POR_KILL) + (assists * PUNTOS_POR_ASSIST) + (deaths * PUNTOS_POR_DEATH)
                + (cs * PUNTOS_POR_CS) + (victoria ? PUNTOS_POR_VICTORIA : 0.0);
        return Math.max(0.0, total);
    }

    @Transactional
    public String calcularPuntosSemana(int semana) {
        // 1. Buscamos solo los partidos de esa semana que aún NO han sido calculados
        List<Partido> partidosPendientes = partidoRepository.findBySemanaAndPuntosCalculadosFalse(semana);
        if (partidosPendientes.isEmpty()) {
            return "Los puntos de la semana " + semana + " ya han sido repartidos o no hay partidos registrados.";
        }

        // 2. Nos aseguramos de tener todas las estadísticas importadas (para todos los
        // partidos de la semana, para que la media sea correcta)
        List<Partido> todosLosPartidosSemana = partidoRepository.findBySemana(semana);
        importarEstadisticasSiNoExisten(todosLosPartidosSemana);

        // 3. Agrupar EstadisticaPartido por (serieId, jugadorId)
        List<EstadisticaPartido> todasLasStatsSemana = estadisticaPartidoRepository.findByPartidoSemana(semana);

        Map<String, Map<Long, List<EstadisticaPartido>>> agrupado = todasLasStatsSemana.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getPartido().getSerieId(),
                        Collectors.groupingBy(s -> s.getJugador().getId())));

        // 4. Calcular medias y contribución por mapa
        Map<Long, Double> puntosAcumuladosPorJugador = new HashMap<>();

        for (String serieId : agrupado.keySet()) {
            Map<Long, List<EstadisticaPartido>> jugadoresEnSerie = agrupado.get(serieId);

            for (Long jugadorId : jugadoresEnSerie.keySet()) {
                List<EstadisticaPartido> mapas = jugadoresEnSerie.get(jugadorId);

                double sumaPuntosBrutos = 0;
                for (EstadisticaPartido mapStat : mapas) {
                    // Determinar victoria para este jugador en este mapa
                    boolean esVictoria = false;
                    String equipoJugador = mapStat.getJugador().getEquipoLec();
                    String equipoGanador = mapStat.getPartido().getWinTeam();
                    if (equipoJugador != null && equipoGanador != null) {
                        esVictoria = equipoJugador.equalsIgnoreCase(equipoGanador);
                    }

                    double ptsBrutos = calcularPuntosPartido(mapStat.getKills(), mapStat.getDeaths(),
                            mapStat.getAssists(), mapStat.getCs(), esVictoria);
                    sumaPuntosBrutos += ptsBrutos;
                }

                // REDONDEO: La media de la serie se redondea al entero más cercano
                long mediaRedondeada = Math.round(sumaPuntosBrutos / mapas.size());

                // Repartimos esos puntos entre los mapas de la serie para que el SUM del
                // ranking sea exacto
                long puntosRestantes = mediaRedondeada;
                for (int i = 0; i < mapas.size(); i++) {
                    EstadisticaPartido mapStat = mapas.get(i);
                    if (i == mapas.size() - 1) {
                        // El último mapa se queda con todo lo que sobre para asegurar que la suma sea
                        // exacta
                        mapStat.setPuntosGenerados(puntosRestantes);
                    } else {
                        long parte = mediaRedondeada / mapas.size();
                        mapStat.setPuntosGenerados(parte);
                        puntosRestantes -= parte;
                    }
                    estadisticaPartidoRepository.save(mapStat);
                }

                puntosAcumuladosPorJugador.put(jugadorId,
                        puntosAcumuladosPorJugador.getOrDefault(jugadorId, 0.0) + mediaRedondeada);
            }
        }

        // 5. REPARTO: Repartir puntos basándose en HistoricoAlineacion
        List<HistoricoAlineacion> snapshot = historicoAlineacionRepository.findBySemana(semana);
        if (snapshot.isEmpty()) {
            return "Error: No hay snapshot para la semana " + semana + ". Haz el snapshot antes de calcular.";
        }

        int equiposActualizados = 0;
        for (HistoricoAlineacion h : snapshot) {
            if (h.getEstado() == EstadoAlineacion.TITULAR) {
                Double puntosGana = puntosAcumuladosPorJugador.get(h.getJugador().getId());
                if (puntosGana != null && puntosGana > 0) {
                    Equipo e = h.getEquipo();
                    e.setPuntuacionTotal(e.getPuntuacionTotal() + puntosGana.longValue());
                    equipoRepository.save(e);
                    equiposActualizados++;
                }
            }
        }

        // 6. IMPORTANTE: Marcar partidos de esta semana como CALCULADOS para no repetir
        // el reparto
        for (Partido p : partidosPendientes) {
            p.setPuntosCalculados(true);
            partidoRepository.save(p);
        }

        return "Éxito: Cálculo de la semana " + semana + " finalizado. " + equiposActualizados
                + " equipos actualizados.";
    }

    private void importarEstadisticasSiNoExisten(List<Partido> partidos) {
        // Filtramos solo los partidos que no tienen estadísticas registradas aún
        List<String> realGameIds = partidos.stream()
                .map(Partido::getGameId)
                .filter(id -> !estadisticaPartidoRepository.existsByPartidoGameId(id))
                .collect(Collectors.toList());

        if (!realGameIds.isEmpty()) {
            System.out.println(
                    "🔍 Detectados " + realGameIds.size() + " partidos sin estadísticas. Iniciando descarga...");
            fetchStatsFromAPI(realGameIds);
        } else {
            System.out.println("✅ Todos los partidos ya tienen estadísticas en la base de datos.");
        }
    }

    private void fetchStatsFromAPI(List<String> gameIds) {
        if (gameIds.isEmpty())
            return;

        // Fandom permite hasta 500 registros por query, procesamos en bloques de 15
        // para ser más precavidos
        int batchSize = 15;
        for (int i = 0; i < gameIds.size(); i += batchSize) {
            // Pequeña pausa entre peticiones para evitar el "ratelimited" de Fandom
            if (i > 0) {
                try {
                    System.out.println("⏸️ Esperando 3 segundos para evitar bloqueo de Fandom...");
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }

            List<String> batch = gameIds.subList(i, Math.min(i + batchSize, gameIds.size()));
            String gameIdsCsv = "'" + String.join("','", batch) + "'";
            String whereClause = "GameId IN (" + gameIdsCsv + ")";

            try {
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json"
                        + "&tables=ScoreboardPlayers"
                        + "&fields=GameId,Name,Kills,Deaths,Assists,CS"
                        + "&where=" + whereClause
                        + "&limit=500";

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
                HttpEntity<String> entity = new HttpEntity<>(headers);

                System.out.println("🚀 Descargando estadísticas batch (" + (i / batchSize + 1) + ") para "
                        + batch.size() + " partidos...");

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                String body = response.getBody();

                if (body == null || body.contains("\"error\"")) {
                    System.err.println("❌ Fandom bloqueó este batch: " + body);
                    continue;
                }

                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                MatchDataResponse responseObj = mapper.readValue(body, MatchDataResponse.class);

                if (responseObj.getCargoquery() != null) {
                    int statsGuardadas = 0;
                    for (MatchDataResponse.CargoItem item : responseObj.getCargoquery()) {
                        MatchDataResponse.MatchStats stats = item.getTitle();
                        String gameId = stats.getGameId();

                        String nicknameLimpio = stats.getNickname().split(" \\(")[0].trim();
                        Optional<Jugador> jugadorOpt = jugadorRepository.findByNickname(nicknameLimpio);

                        if (jugadorOpt.isPresent()) {
                            Jugador jugador = jugadorOpt.get();
                            if (!estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(gameId,
                                    jugador.getId())) {
                                Optional<Partido> partidoOpt = partidoRepository.findById(gameId);
                                if (partidoOpt.isPresent()) {
                                    int kills = Integer.parseInt(stats.getKills());
                                    int deaths = Integer.parseInt(stats.getDeaths());
                                    int assists = Integer.parseInt(stats.getAssists());
                                    int cs = Integer.parseInt(stats.getCs());

                                    EstadisticaPartido ep = new EstadisticaPartido();
                                    ep.setPartido(partidoOpt.get());
                                    ep.setJugador(jugador);
                                    ep.setKills(kills);
                                    ep.setDeaths(deaths);
                                    ep.setAssists(assists);
                                    ep.setCs(cs);

                                    boolean esVictoria = false;
                                    if (jugador.getEquipoLec() != null && partidoOpt.get().getWinTeam() != null) {
                                        esVictoria = jugador.getEquipoLec()
                                                .equalsIgnoreCase(partidoOpt.get().getWinTeam());
                                    }

                                    ep.setPuntosGenerados(
                                            Math.round(calcularPuntosPartido(kills, deaths, assists, cs, esVictoria)));

                                    estadisticaPartidoRepository.save(ep);
                                    statsGuardadas++;
                                }
                            }
                        }
                    }
                    System.out.println(
                            "✅ Procesado correctamente: " + statsGuardadas + " filas de estadísticas guardadas.");
                }
            } catch (Exception e) {
                System.err.println("Error al procesar batch de estadísticas: " + e.getMessage());
            }
        }
    }

    @Transactional
    public String procesarPartidosPendientes() {
        // Podríamos mantener esto como un alias que busca la última semana sin procesar
        // o simplemente decir que ahora usamos calcularPuntosSemana(X)
        return "Este método está obsoleto. Usa calcularPuntosSemana(X) para el reparto con Bo3 y Snapshot.";
    }
}
