package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO;
import com.lecfantasy.backend.dto.JugadorEstadisticaDTO;
import com.lecfantasy.backend.dto.LeaguepediaResponse;
import com.lecfantasy.backend.entity.EstadisticaPartido;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.JugadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JugadorService {

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

    public void importarJugadoresDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();

        String torneo = "LEC/2026 Season/Spring Season";

        // Query para sacar jugadores y sus nombres reales uniendo TournamentPlayers con Players
        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json"
                + "&tables=TournamentPlayers=TP,Players=P"
                + "&fields=TP.Player=ID,P.Name=Name,TP.Role=Role,TP.Team=Team"
                + "&where=TP.OverviewPage='{torneo}'"
                + "&join_on=TP.Player=P.ID"
                + "&limit=100";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("Conectando con Leaguepedia para el torneo: " + torneo);

            ResponseEntity<LeaguepediaResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    LeaguepediaResponse.class,
                    torneo);

            LeaguepediaResponse responseBody = response.getBody();

            if (responseBody != null && responseBody.getCargoquery() != null
                    && !responseBody.getCargoquery().isEmpty()) {
                System.out
                        .println("¡Mapeo exitoso! Procesando " + responseBody.getCargoquery().size() + " registros...");

                for (LeaguepediaResponse.CargoItem item : responseBody.getCargoquery()) {
                    LeaguepediaResponse.PlayerTitle title = item.getTitle();
                    String rawNickname = title.getId();
                    String nombreReal = title.getName();
                    String rol = title.getRole();

                    if (rawNickname == null || rol == null || rol.equalsIgnoreCase("Coach")) {
                        continue;
                    }

                    // Limpieza del nickname: "Noah (Oh Hyeon-taek)" -> "Noah"
                    String nickname = rawNickname.split(" \\(")[0].trim();

                    Optional<Jugador> existe = jugadorRepository.findByNickname(nickname);
                    if (existe.isEmpty()) {
                        Jugador nuevoJugador = new Jugador();
                        nuevoJugador.setNickname(nickname);
                        nuevoJugador.setNombreReal(nombreReal != null && !nombreReal.isEmpty() ? nombreReal : nickname);
                        nuevoJugador.setRol(rol);
                        nuevoJugador.setPrecioBase(5000.0);
                        nuevoJugador.setEquipoLec(title.getTeam());

                        jugadorRepository.save(nuevoJugador);
                        System.out.println("✅ Guardado en BD: " + nickname + " (" + rol + ") - " + title.getTeam());
                    }
                }
                System.out.println("Importación finalizada con éxito.");
            } else {
                System.out.println("⚠️ La respuesta de la API no contiene datos o el formato es incorrecto.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error durante la importación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Jugador> obtenerTodosLosJugadores() {
        return jugadorRepository.findAll();
    }

    public List<JugadorPuntuacionTotalDTO> obtenerRankingJugadores() {
        return jugadorRepository.findAllWithTotalPoints();
    }

    public List<JugadorEstadisticaDTO> obtenerEstadisticasJugador(Long idJugador) {
        // Buscamos todas las filas en la tabla estadisticas_partidos para este jugador
        List<EstadisticaPartido> estadisticas = estadisticaPartidoRepository.findByJugadorId(idJugador);

        // Convertimos cada fila a un objeto DTO limpio para el frontend
        return estadisticas.stream().map(e -> {
            JugadorEstadisticaDTO dto = new JugadorEstadisticaDTO();
            dto.setGameId(e.getPartido().getGameId());
            dto.setMatchName(e.getPartido().getTeam1() + " vs " + e.getPartido().getTeam2());
            dto.setTeam1(e.getPartido().getTeam1());
            dto.setTeam2(e.getPartido().getTeam2());
            dto.setFecha(e.getPartido().getFechaUtc());
            dto.setSemana(e.getPartido().getJornada() != null ? e.getPartido().getJornada().getNumeroSemana() : null);
            dto.setSerieId(e.getPartido().getSerieId());
            
            // Determinar si ganó o perdió el mapa
            if (e.getJugador().getEquipoLec() != null && e.getPartido().getWinTeam() != null) {
                dto.setResultado(e.getJugador().getEquipoLec().equalsIgnoreCase(e.getPartido().getWinTeam()) ? "WIN" : "LOSS");
            }
            
            dto.setKills(e.getKills());
            dto.setDeaths(e.getDeaths());
            dto.setAssists(e.getAssists());
            dto.setCs(e.getCs());
            dto.setPuntosGenerados(e.getPuntosGenerados());
            return dto;
        }).collect(Collectors.toList());
    }
    
    public Jugador obtenerDetalleJugador(Long id) {
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado con ID: " + id));
    }
}
