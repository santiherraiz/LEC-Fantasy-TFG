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
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;

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
        // Usamos un patrón más flexible por si el nombre varía ligeramente
        String torneoPattern = "LEC 2026 Spring";

        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json"
                + "&tables=ScoreboardGames.Team1=SG"
                + "&fields=SG.Team1=Team1,SG.Team2=Team2,SG.WinTeam=WinTeam,SG.LossTeam=LossTeam,SG.DateTime_UTC=dateTimeUtc,SG.MatchId=MatchId,SG.Round=Round"
                + "&where=SG.Tournament='{torneo}'"
                + "&limit=100";

        HttpHeaders headers = new HttpHeaders();
        // Usamos un User-Agent de navegador real para evitar bloqueos
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("🚀 Intentando importar con patrón: " + torneoPattern);
            // Si estamos bloqueados, este sleep nos ayuda a que Fandom se relaje
            Thread.sleep(3000); 

            ResponseEntity<String> responseStr = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class, torneoPattern);

            String bodyStr = responseStr.getBody();
            if (bodyStr == null || bodyStr.contains("\"error\"")) {
                System.err.println("❌ Fandom sigue bloqueándonos (Rate Limit).");
                System.out.println("💡 TIP: He habilitado datos de prueba. Llama a /api/admin/debug/seed-semana-1 para testear sin la API.");
                return;
            }
        
            // Si llegamos aquí, el JSON parece válido, lo mapeamos
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            PartidoLeaguepediaDTO body = mapper.readValue(bodyStr, PartidoLeaguepediaDTO.class);

            if (body != null && body.getCargoquery() != null && !body.getCargoquery().isEmpty()) {
                System.out.println("✅ ¡Éxito! Procesando " + body.getCargoquery().size() + " partidos...");
                for (PartidoLeaguepediaDTO.CargoItem item : body.getCargoquery()) {
                    PartidoLeaguepediaDTO.PartidoData data = item.getTitle();
                    // ... resto del código de guardado ...

                    Optional<Partido> partidoOpt = partidoRepository.findById(data.getGameId());
                    Partido partido;
                    boolean isNew = false;

                    if (partidoOpt.isEmpty()) {
                        partido = new Partido();
                        partido.setGameId(data.getGameId());
                        isNew = true;
                        System.out.println("  - Es un partido nuevo.");
                    } else {
                        partido = partidoOpt.get();
                        System.out.println("  - Es un partido existente, actualizando.");
                    }

                    partido.setTeam1(data.getTeam1());
                    partido.setTeam2(data.getTeam2());
                    partido.setWinTeam(data.getWinTeam());
                    partido.setLossTeam(data.getLossTeam());
                    partido.setFechaUtc(data.getDateTimeUtc());
                    partido.setSerieId(data.getMatchId());

                    // Parsear semana desde el Round (Ej: "Week 1" -> 1)
                    int semanaNum = 1;
                    if (data.getRound() != null) {
                        try {
                            String r = data.getRound().replaceAll("[^0-9]", "");
                            if (!r.isEmpty()) {
                                semanaNum = Integer.parseInt(r);
                            }
                        } catch (Exception e) {
                        }
                    }
                    partido.setSemana(semanaNum);

                    if (isNew) {
                        partido.setPuntosCalculados(false);
                    }

                    partidoRepository.save(partido);
                    System.out.println("  - Guardado en DB con éxito.");
                }
            } else {
                System.out.println("⚠️ La respuesta de la API no contiene datos (cargoquery es nulo o vacío).");
            }
        } catch (Exception e) {
            System.err.println("Error importando partidos: " + e.getMessage());
        }
    }

    @Transactional
    public String crearDatosPruebaSemana1() {
        // 1. Buscamos o creamos un jugador (ej: Caps)
        Jugador caps = jugadorRepository.findByNickname("Caps").orElseGet(() -> {
            Jugador j = new Jugador();
            j.setNickname("Caps");
            j.setNombreReal("Rasmus Winther");
            j.setRol("Mid");
            j.setEquipoLec("G2 Esports");
            j.setPrecioBase(10000.0);
            return jugadorRepository.save(j);
        });

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
                p.setPuntosCalculados(false);
                partidoRepository.save(p);

                // Insertamos estadísticas brutas: Mapa 1 (40 pts), Mapa 2 (60 pts) -> Media debería ser 50
                EstadisticaPartido ep = new EstadisticaPartido();
                ep.setPartido(p);
                ep.setJugador(caps);
                ep.setKills(i == 1 ? 5 : 10); // Más kills en el segundo mapa
                ep.setDeaths(2);
                ep.setAssists(10);
                ep.setCs(300);
                ep.setPuntosGenerados(0.0);
                estadisticaPartidoRepository.save(ep);
            }
        }

        return "✅ Datos de prueba creados. Ahora puedes hacer el Snapshot y luego Calcular la Semana 1.";
    }


    private static final double PUNTOS_POR_KILL = 3.0;
    private static final double PUNTOS_POR_ASSIST = 1.5;
    private static final double PUNTOS_POR_DEATH = -1.0;
    private static final double PUNTOS_POR_CS = 0.02;

    public double calcularPuntosPartido(int kills, int deaths, int assists, int cs) {
        double total = (kills * PUNTOS_POR_KILL) + (assists * PUNTOS_POR_ASSIST) + (deaths * PUNTOS_POR_DEATH)
                + (cs * PUNTOS_POR_CS);
        return Math.max(0.0, total);
    }

    @Transactional
    public String calcularPuntosSemana(int semana) {
        // 1. Buscamos todos los partidos de esa semana
        List<Partido> partidosSemana = partidoRepository.findBySemana(semana);
        if (partidosSemana.isEmpty()) {
            return "No hay partidos registrados para la semana " + semana;
        }

        // 2. Nos aseguramos de tener todas las estadísticas de esos mapas importadas
        // (Reutilizamos la lógica de importación masiva de stats)
        importarEstadisticasSiNoExisten(partidosSemana);

        // 3. Agrupar EstadisticaPartido por (serieId, jugadorId) para calcular la media
        // Buscamos todas las estadísticas de los partidos de esta semana
        List<EstadisticaPartido> todasLasStatsSemana = estadisticaPartidoRepository.findAll().stream()
                .filter(s -> s.getPartido().getSemana() != null && s.getPartido().getSemana() == semana)
                .collect(Collectors.toList());

        // Agrupamos: serieId -> jugadorId -> lista de stats (mapas)
        Map<String, Map<Long, List<EstadisticaPartido>>> agrupado = todasLasStatsSemana.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getPartido().getSerieId() != null ? s.getPartido().getSerieId()
                                : "SINGLE_MAP_" + s.getPartido().getGameId(),
                        Collectors.groupingBy(s -> s.getJugador().getId())));

        // 4. Calcular medias y actualizar EstadisticaPartido.puntosGenerados
        // También guardamos en un mapa temporal para el reparto final: (jugadorId,
        // totalPuntosSemana)
        Map<Long, Double> puntosAcumuladosPorJugador = new HashMap<>();

        for (String serieId : agrupado.keySet()) {
            Map<Long, List<EstadisticaPartido>> jugadoresEnSerie = agrupado.get(serieId);

            for (Long jugadorId : jugadoresEnSerie.keySet()) {
                List<EstadisticaPartido> mapas = jugadoresEnSerie.get(jugadorId);

                // Calculamos el bruto de cada mapa según fórmula normal
                double sumaPuntosBrutos = 0;
                for (EstadisticaPartido mapStat : mapas) {
                    double puntosBrutos = calcularPuntosPartido(mapStat.getKills(), mapStat.getDeaths(),
                            mapStat.getAssists(), mapStat.getCs());
                    sumaPuntosBrutos += puntosBrutos;
                }

                // LA MAGIA: Media del Bo3
                double mediaSerie = sumaPuntosBrutos / mapas.size();

                // Actualizamos cada mapa con la media para que se vea en la UI
                for (EstadisticaPartido mapStat : mapas) {
                    mapStat.setPuntosGenerados(mediaSerie);
                    estadisticaPartidoRepository.save(mapStat);
                }

                // Acumulamos para el reparto semanal (un jugador puede jugar varias series en
                // la misma semana)
                puntosAcumuladosPorJugador.put(jugadorId,
                        puntosAcumuladosPorJugador.getOrDefault(jugadorId, 0.0) + mediaSerie);
            }
        }

        // 5. REPARTO: Repartir puntos basándose en HistoricoAlineacion
        List<HistoricoAlineacion> snapshot = historicoAlineacionRepository.findBySemana(semana);
        if (snapshot.isEmpty()) {
            return "Error: No hay snapshot (foto fija) para la semana " + semana
                    + ". ¿Se te olvidó darle al botón de snapshot el sábado?";
        }

        int equiposActualizados = 0;
        for (HistoricoAlineacion h : snapshot) {
            if (h.getEstado() == EstadoAlineacion.TITULAR) {
                Double puntosGana = puntosAcumuladosPorJugador.get(h.getJugador().getId());
                if (puntosGana != null && puntosGana > 0) {
                    Equipo e = h.getEquipo();
                    e.setPuntuacionTotal(e.getPuntuacionTotal() + puntosGana);
                    equipoRepository.save(e);
                    equiposActualizados++;
                }
            }
        }

        // 6. Marcar partidos como procesados
        for (Partido p : partidosSemana) {
            p.setPuntosCalculados(true);
            partidoRepository.save(p);
        }

        return "Cálculo semana " + semana + " completado. " + equiposActualizados + " equipos han recibido puntos.";
    }

    private void importarEstadisticasSiNoExisten(List<Partido> partidos) {
        // Extraemos los IDs que no tienen aún estadísticas en nuestra BD
        List<String> gameIds = partidos.stream()
                .map(Partido::getGameId)
                .collect(Collectors.toList());

        // El resto es igual a procesarPartidosPendientes pero sin repartir puntos
        // ... (lógica de llamada a API ScoreboardPlayers)
        fetchStatsFromAPI(gameIds);
    }

    private void fetchStatsFromAPI(List<String> gameIds) {
        if (gameIds.isEmpty())
            return;

        String gameIdsCsv = "'" + String.join("','", gameIds) + "'";
        String whereClause = "GameId IN (" + gameIdsCsv + ")";
        String fields = "GameId,Name,Kills,Deaths,Assists,CS";

        try {
            RestTemplate restTemplate = new RestTemplate();
            String encodedWhere = URLEncoder.encode(whereClause, StandardCharsets.UTF_8.toString());
            String encodedFields = URLEncoder.encode(fields, StandardCharsets.UTF_8.toString());

            String fullUrl = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                    "&tables=ScoreboardPlayers&fields=" + encodedFields +
                    "&where=" + encodedWhere + "&limit=500";

            URI uri = new URI(fullUrl);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "LECFantasyApp/1.0 (TFG Project; contact: santiherra06@gmail.com)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<MatchDataResponse> response = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, MatchDataResponse.class);

            if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                for (MatchDataResponse.CargoItem item : response.getBody().getCargoquery()) {
                    MatchDataResponse.MatchStats stats = item.getTitle();
                    String gameId = stats.getGameId();

                    String nicknameLimpio = stats.getNickname().split(" \\(")[0].trim();
                    Optional<Jugador> jugadorOpt = jugadorRepository.findByNickname(nicknameLimpio);

                    if (jugadorOpt.isPresent()) {
                        Jugador jugador = jugadorOpt.get();

                        if (!estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(gameId, jugador.getId())) {
                            Optional<Partido> partidoOpt = partidoRepository.findById(gameId);
                            if (partidoOpt.isPresent()) {
                                Partido partido = partidoOpt.get();
                                int kills = Integer.parseInt(stats.getKills());
                                int deaths = Integer.parseInt(stats.getDeaths());
                                int assists = Integer.parseInt(stats.getAssists());
                                int cs = Integer.parseInt(stats.getCs());

                                EstadisticaPartido estadistica = new EstadisticaPartido();
                                estadistica.setPartido(partido);
                                estadistica.setJugador(jugador);
                                estadistica.setKills(kills);
                                estadistica.setDeaths(deaths);
                                estadistica.setAssists(assists);
                                estadistica.setCs(cs);
                                estadistica.setPuntosGenerados(0.0); // Se calculará después en calcularPuntosSemana
                                estadisticaPartidoRepository.save(estadistica);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Transactional
    public String procesarPartidosPendientes() {
        // Podríamos mantener esto como un alias que busca la última semana sin procesar
        // o simplemente decir que ahora usamos calcularPuntosSemana(X)
        return "Este método está obsoleto. Usa calcularPuntosSemana(X) para el reparto con Bo3 y Snapshot.";
    }
}
