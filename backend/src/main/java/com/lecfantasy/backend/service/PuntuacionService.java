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
        int partidosProcesados = 0;

        if (partidosPendientes.isEmpty()) {
            return "No hay partidos nuevos que procesar.";
        }

        RestTemplate restTemplate = new RestTemplate();

        for (Partido partido : partidosPendientes) {
            try {
                System.out.println("Procesando estadísticas para el partido: " + partido.getGameId());

                // 2. Apuntamos a la tabla 'ScoreboardPlayers' y filtramos por el GameId exacto
                String whereClause = "GameId='" + partido.getGameId() + "'";
                String fields = "Name,Kills,Deaths,Assists,CS";

                String encodedWhere = URLEncoder.encode(whereClause, StandardCharsets.UTF_8.toString());
                String encodedFields = URLEncoder.encode(fields, StandardCharsets.UTF_8.toString());

                String fullUrl = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                        "&tables=ScoreboardPlayers&fields=" + encodedFields +
                        "&where=" + encodedWhere + "&limit=50";

                URI uri = new URI(fullUrl);
                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36");
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<MatchDataResponse> response = restTemplate.exchange(
                        uri, HttpMethod.GET, entity, MatchDataResponse.class);

                if (response.getBody() != null && response.getBody().getCargoquery() != null) {
                    for (MatchDataResponse.CargoItem item : response.getBody().getCargoquery()) {
                        MatchDataResponse.MatchStats stats = item.getTitle();

                        // 3. Verificamos si este jugador pertenece a nuestro catálogo de la LEC 2026
                        Optional<Jugador> jugadorOpt = jugadorRepository.findByNickname(stats.getNickname());

                        if (jugadorOpt.isPresent()) {
                            Jugador jugador = jugadorOpt.get();

                            // 4. Comprobación de seguridad: ¿Ya habíamos guardado esta estadística por
                            // error?
                            if (!estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(partido.getGameId(),
                                    jugador.getId())) {

                                // Calculamos sus puntos con tu fórmula
                                double puntos = calcularPuntosPartido(stats.getKills(), stats.getDeaths(),
                                        stats.getAssists(), stats.getCs());

                                // --- A. GUARDAMOS EL HISTORIAL (LA NUEVA TABLA) ---
                                EstadisticaPartido estadistica = new EstadisticaPartido();
                                estadistica.setPartido(partido);
                                estadistica.setJugador(jugador);
                                estadistica.setKills(stats.getKills());
                                estadistica.setDeaths(stats.getDeaths());
                                estadistica.setAssists(stats.getAssists());
                                estadistica.setCs(stats.getCs());
                                estadistica.setPuntosGenerados(puntos);
                                estadisticaPartidoRepository.save(estadistica);

                                // --- B. REPARTIMOS EL PREMIO A LOS MÁNAGERS ---
                                List<Plantilla> usuarios = plantillaRepository.findByJugadorNicknameAndEstado(
                                        jugador.getNickname(), EstadoAlineacion.TITULAR);
                                for (Plantilla p : usuarios) {
                                    Equipo e = p.getEquipo();
                                    e.setPuntuacionTotal(e.getPuntuacionTotal() + puntos);
                                    equipoRepository.save(e);
                                }
                            }
                        }
                    }
                    // 5. ¡Partido completado! Cerramos el grifo para no volver a darle puntos a la
                    // gente
                    partido.setPuntosCalculados(true);
                    partidoRepository.save(partido);
                    partidosProcesados++;
                }
            } catch (Exception e) {
                System.err.println("Error procesando el partido " + partido.getGameId() + ": " + e.getMessage());
            }
        }
        return "Éxito: Se han procesado " + partidosProcesados
                + " partidos, guardado estadísticas y repartido los puntos.";
    }
}