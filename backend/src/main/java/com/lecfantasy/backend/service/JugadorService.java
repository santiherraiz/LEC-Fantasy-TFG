package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.LeaguepediaResponse;
import com.lecfantasy.backend.entity.Jugador;
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

@Service
public class JugadorService {

    @Autowired
    private JugadorRepository jugadorRepository;

    public void importarJugadoresDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();

        String torneo = "LEC/2026 Season/Spring Season";

        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=TournamentPlayers&fields=Player=ID,Role,Team&where=Tournament='"
                + torneo + "'&limit=100";

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("Conectando con Leaguepedia...");

            // Ahora sí, Spring cogerá la variable 'torneo' y la inyectará en la URL de
            // forma segura
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
                    String nickname = title.getId();
                    String nombreReal = title.getName();
                    String rol = title.getRole();

                    if (nickname == null || rol == null) {
                        continue;
                    }

                    Optional<Jugador> existe = jugadorRepository.findByNickname(nickname);
                    if (existe.isEmpty()) {
                        Jugador nuevoJugador = new Jugador();
                        nuevoJugador.setNickname(nickname);
                        // Si no hay nombre real, usamos el nickname
                        nuevoJugador.setNombreReal(nombreReal != null && !nombreReal.isEmpty() ? nombreReal : nickname);
                        nuevoJugador.setRol(rol);
                        nuevoJugador.setPrecioBase(5000.0);

                        jugadorRepository.save(nuevoJugador);
                        System.out.println("✅ Guardado en BD: " + nickname + " (" + rol + ")");
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
}