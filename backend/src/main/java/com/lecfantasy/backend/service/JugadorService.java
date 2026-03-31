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
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;

@Service
public class JugadorService {

    @Autowired
    private JugadorRepository jugadorRepository;

    public void importarJugadoresDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();

        // Usamos la URL para traernos 50 jugadores al azar para probar
        String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=Players&fields=ID,Name,Role&limit=50";

        HttpHeaders headers = new HttpHeaders();
        // 1. El Bot Educado: Fandom confía más en los bots que se identifican claramente.
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        // 2. Le decimos que aceptamos JSON explícitamente
        headers.set("Accept", "application/json");
        // 3. Simulamos un comportamiento de navegador estándar
        headers.set("Connection", "keep-alive");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("Conectando con Leaguepedia...");

            // Hacemos la petición
            ResponseEntity<String> rawResponse = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            System.out.println("Respuesta cruda de la API: " + rawResponse.getBody());

            ObjectMapper mapper = new ObjectMapper();
            LeaguepediaResponse response = mapper.readValue(rawResponse.getBody(), LeaguepediaResponse.class);

            if (response != null && response.getCargoquery() != null && !response.getCargoquery().isEmpty()) {
                System.out.println("¡Mapeo exitoso! Procesando jugadores...");
                for (LeaguepediaResponse.CargoItem item : response.getCargoquery()) {
                    String nickname = item.getTitle().getId();
                    String nombreReal = item.getTitle().getName();
                    String rol = item.getTitle().getRole();

                    if (nickname == null || rol == null) continue;

                    Optional<Jugador> existe = jugadorRepository.findByNickname(nickname);
                    if (existe.isEmpty()) {
                        Jugador nuevoJugador = new Jugador();
                        nuevoJugador.setNickname(nickname);
                        nuevoJugador.setNombreReal(nombreReal != null && !nombreReal.isEmpty() ? nombreReal : nickname);
                        nuevoJugador.setRol(rol);
                        nuevoJugador.setPrecioBase(5000.0);

                        jugadorRepository.save(nuevoJugador);
                        System.out.println("✅ Fichado en BD: " + nickname + " (" + rol + ")");
                    }
                }
                System.out.println("Importación finalizada con éxito.");
            } else {
                System.out.println("⚠️ No hay 'cargoquery' en el JSON. Revisa la respuesta cruda arriba.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }

    public List<Jugador> obtenerTodosLosJugadores() {
        // findAll() es un método mágico de Spring que hace un "SELECT * FROM jugadores"
        return jugadorRepository.findAll();
    }
}