package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.MatchDataResponse;
import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO;
import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO.PartidoData;
import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.entity.Partido;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.repository.EquipoRepository;
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
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PuntuacionService {

    @Autowired
    private PlantillaRepository plantillaRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private PartidoRepository partidoRepository;

    private static final double PUNTOS_POR_KILL = 3.0;
    private static final double PUNTOS_POR_ASSIST = 1.5;
    private static final double PUNTOS_POR_DEATH = -1.0;
    private static final double PUNTOS_POR_CS = 0.02;

    public double calcularPuntosPartido(int kills, int deaths, int assists, int cs) {
        double total = (kills * PUNTOS_POR_KILL) + (assists * PUNTOS_POR_ASSIST) + (deaths * PUNTOS_POR_DEATH) + (cs * PUNTOS_POR_CS);
        return Math.max(0.0, total);
    }

    @Transactional
    public void procesarJornadaLeaguepedia(String gameId) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=ScoreboardPlayers&fields=Name,Kills,Deaths,Assists,CS&where=GameId='" + gameId + "'";
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<MatchDataResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity, MatchDataResponse.class);
            if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                for (MatchDataResponse.CargoItem item : response.getBody().getCargoquery()) {
                    MatchDataResponse.MatchStats stats = item.getTitle();
                    double puntos = calcularPuntosPartido(stats.getKills(), stats.getDeaths(), stats.getAssists(), stats.getCs());
                    List<Plantilla> usuarios = plantillaRepository.findByJugadorNicknameAndEstado(stats.getNickname(), EstadoAlineacion.TITULAR);
                    for (Plantilla p : usuarios) {
                        Equipo e = p.getEquipo();
                        e.setPuntuacionTotal(e.getPuntuacionTotal() + puntos);
                        equipoRepository.save(e);
                    }
                }
            }
        } catch (Exception e) { throw new RuntimeException("Error sincronizando puntos: " + e.getMessage()); }
    }

    public List<PartidoData> obtenerPartidosPorTorneo(String torneo) {
        RestTemplate restTemplate = new RestTemplate();

        try {
            String whereClause = "ScoreboardGames.Tournament='" + torneo + "'";
            String fields = "Tournament,Team1,Team2,Team1Score,Team2Score,WinTeam,LossTeam,DateTime_UTC,GameId";

            String encodedWhere = URLEncoder.encode(whereClause, StandardCharsets.UTF_8.toString());
            String encodedFields = URLEncoder.encode(fields, StandardCharsets.UTF_8.toString());

            String fullUrl = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                    "&tables=ScoreboardGames&fields=" + encodedFields +
                    "&where=" + encodedWhere + "&limit=200";

            URI uri = new URI(fullUrl);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<PartidoLeaguepediaDTO> response = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, PartidoLeaguepediaDTO.class
            );

            System.out.println("Cuerpo de la respuesta: " + response.getBody());
            if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                System.out.println("Partidos encontrados: " + response.getBody().getCargoquery().size());
            }

            if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                List<PartidoData> partidosDescargados = response.getBody().getCargoquery().stream()
                        .map(PartidoLeaguepediaDTO.CargoItem::getTitle)
                        .collect(Collectors.toList());

                // 3. LA NUEVA LÓGICA: Guardar en Base de Datos
                for (PartidoData dto : partidosDescargados) {
                    // Comprobamos si el partido ya existe para no duplicarlo
                    if (!partidoRepository.existsById(dto.getGameId())) {
                        Partido nuevoPartido = new Partido();
                        nuevoPartido.setGameId(dto.getGameId());
                        nuevoPartido.setTorneo(dto.getTournament());
                        nuevoPartido.setTeam1(dto.getTeam1());
                        nuevoPartido.setTeam2(dto.getTeam2());
                        nuevoPartido.setTeam1Score(dto.getTeam1Score());
                        nuevoPartido.setTeam2Score(dto.getTeam2Score());
                        nuevoPartido.setWinTeam(dto.getWinTeam());
                        nuevoPartido.setLossTeam(dto.getLossTeam());
                        nuevoPartido.setDateTimeUtc(dto.getDateTimeUtc());
                        // puntosCalculados se pone a false automáticamente por defecto

                        partidoRepository.save(nuevoPartido);
                    }
                }
                return partidosDescargados;
            }
            return List.of();
        } catch (Exception e) {
            throw new RuntimeException("Error en Leaguepedia: " + e.getMessage());
        }
    }

}