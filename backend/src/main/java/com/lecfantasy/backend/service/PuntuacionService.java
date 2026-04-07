package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.MatchDataResponse;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.EstadisticaPartido;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.entity.Partido;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.PartidoRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    public void importarPartidosDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();
        String torneo = "LEC/2026 Season/Spring Season";

        // Query para traer los partidos terminados de este torneo
        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                "&tables=ScoreboardGames" +
                "&fields=GameId,Tournament,Team1,Team2,Team1Score,Team2Score,WinTeam,LossTeam,DateTime_UTC" +
                "&where=OverviewPage='{torneo}' AND WinTeam IS NOT NULL" +
                "&limit=100";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("Importando partidos desde Leaguepedia para: " + torneo);

            ResponseEntity<com.lecfantasy.backend.dto.PartidoLeaguepediaDTO> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    com.lecfantasy.backend.dto.PartidoLeaguepediaDTO.class,
                    torneo);

            com.lecfantasy.backend.dto.PartidoLeaguepediaDTO body = response.getBody();

            if (body != null && body.getCargoquery() != null) {
                for (com.lecfantasy.backend.dto.PartidoLeaguepediaDTO.CargoItem item : body.getCargoquery()) {
                    com.lecfantasy.backend.dto.PartidoLeaguepediaDTO.PartidoData data = item.getTitle();

                    if (!partidoRepository.existsById(data.getGameId())) {
                        Partido nuevoPartido = new Partido();
                        nuevoPartido.setGameId(data.getGameId());
                        nuevoPartido.setTorneo(data.getTournament());
                        nuevoPartido.setTeam1(data.getTeam1());
                        nuevoPartido.setTeam2(data.getTeam2());
                        nuevoPartido.setTeam1Score(data.getTeam1Score());
                        nuevoPartido.setTeam2Score(data.getTeam2Score());
                        nuevoPartido.setWinTeam(data.getWinTeam());
                        nuevoPartido.setLossTeam(data.getLossTeam());
                        nuevoPartido.setDateTimeUtc(data.getDateTimeUtc());
                        nuevoPartido.setPuntosCalculados(false);

                        partidoRepository.save(nuevoPartido);
                        System.out.println("✅ Partido guardado: " + data.getGameId());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error importando partidos: " + e.getMessage());
        }
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
    public String procesarPartidosPendientes() {
        // 1. Buscamos TODOS los partidos que tengan la bandera en 'false'
        List<Partido> partidosPendientes = partidoRepository.findByPuntosCalculadosFalse();

        if (partidosPendientes.isEmpty()) {
            return "No hay partidos nuevos que procesar.";
        }

        // Extraemos los IDs para hacer una sola consulta a la API
        List<String> gameIds = partidosPendientes.stream()
                .map(Partido::getGameId)
                .collect(Collectors.toList());

        // Construimos el WHERE con un IN ('id1', 'id2'...)
        String gameIdsCsv = "'" + String.join("','", gameIds) + "'";
        String whereClause = "GameId IN (" + gameIdsCsv + ")";
        String fields = "GameId,Name,Kills,Deaths,Assists,CS";

        try {
            RestTemplate restTemplate = new RestTemplate();
            String encodedWhere = URLEncoder.encode(whereClause, StandardCharsets.UTF_8.toString());
            String encodedFields = URLEncoder.encode(fields, StandardCharsets.UTF_8.toString());

            // Aumentamos el limit a 500 (10 jugadores x 50 partidos max)
            String fullUrl = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                    "&tables=ScoreboardPlayers&fields=" + encodedFields +
                    "&where=" + encodedWhere + "&limit=500";

            URI uri = new URI(fullUrl);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "LECFantasyApp/1.0 (TFG Project; contact: santiherra06@gmail.com)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            System.out.println("Solicitando estadísticas masivas a Leaguepedia...");
            ResponseEntity<MatchDataResponse> response = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, MatchDataResponse.class);

            if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                int statsProcesadas = 0;
                
                for (MatchDataResponse.CargoItem item : response.getBody().getCargoquery()) {
                    MatchDataResponse.MatchStats stats = item.getTitle();
                    String gameId = stats.getGameId();
                    
                    String nicknameLimpio = stats.getNickname().split(" \\(")[0].trim();
                    Optional<Jugador> jugadorOpt = jugadorRepository.findByNickname(nicknameLimpio);

                    if (jugadorOpt.isPresent()) {
                        Jugador jugador = jugadorOpt.get();
                        
                        // Buscamos el objeto Partido correspondiente
                        Optional<Partido> partidoOpt = partidosPendientes.stream()
                                .filter(p -> p.getGameId().equals(gameId))
                                .findFirst();

                        if (partidoOpt.isPresent() && !estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(gameId, jugador.getId())) {
                            Partido partido = partidoOpt.get();
                            
                            int kills = Integer.parseInt(stats.getKills());
                            int deaths = Integer.parseInt(stats.getDeaths());
                            int assists = Integer.parseInt(stats.getAssists());
                            int cs = Integer.parseInt(stats.getCs());

                            double puntos = calcularPuntosPartido(kills, deaths, assists, cs);

                            EstadisticaPartido estadistica = new EstadisticaPartido();
                            estadistica.setPartido(partido);
                            estadistica.setJugador(jugador);
                            estadistica.setKills(kills);
                            estadistica.setDeaths(deaths);
                            estadistica.setAssists(assists);
                            estadistica.setCs(cs);
                            estadistica.setPuntosGenerados(puntos);
                            estadisticaPartidoRepository.save(estadistica);

                            // Reparto de puntos
                            List<Plantilla> usuarios = plantillaRepository.findByJugadorNicknameAndEstado(
                                    jugador.getNickname(), EstadoAlineacion.TITULAR);
                            for (Plantilla p : usuarios) {
                                Equipo e = p.getEquipo();
                                e.setPuntuacionTotal(e.getPuntuacionTotal() + puntos);
                                equipoRepository.save(e);
                            }
                            statsProcesadas++;
                        }
                    }
                }

                // Marcamos todos los partidos como calculados
                for (Partido p : partidosPendientes) {
                    p.setPuntosCalculados(true);
                    partidoRepository.save(p);
                }

                return "Éxito: Se han procesado " + partidosPendientes.size() + " partidos (" + statsProcesadas + " estadísticas individuales).";
            }
        } catch (Exception e) {
            System.err.println("Error en el procesamiento masivo: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
        return "No se pudieron obtener estadísticas de la API.";
    }
}
