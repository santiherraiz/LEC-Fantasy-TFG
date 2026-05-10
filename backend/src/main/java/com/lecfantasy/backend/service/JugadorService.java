package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.JugadorPuntuacionTotalDTO;
import com.lecfantasy.backend.dto.JugadorEstadisticaDTO;
import com.lecfantasy.backend.dto.JugadorDetalleDTO;
import com.lecfantasy.backend.dto.LeaguepediaResponse;
import com.lecfantasy.backend.entity.EstadisticaPartido;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.entity.EquipoLec;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.repository.EstadisticaPartidoRepository;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JugadorService {

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private PlantillaRepository plantillaRepository;

    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

    @Autowired
    private PuntuacionService puntuacionService;

    private final String MIS_COOKIES = "exp_bucket=v8-30; exp_bucket_2=v5-71; Geo=OK; addtl_consent=1~; euconsent-v2=CPt3fQAPt3fQACNAFAENDLCgAAAAAAAAACiQAAAOCgDAB-AIsAZ8A6QDBAHBAAAA.YAAAAAAAAAAA; tracking-opt-in-status=rejected; eb=21; wikia_beacon_id=UoF5QNPsWU; _b2=33lVvLjkgb.1772207254112; wikia_session_id=YoPddHOEPf; tech-update-disable-banner-global=1; Geo={%22region%22:%22VC%22%2C%22city%22:%22valencia%22%2C%22country_name%22:%22spain%22%2C%22country%22:%22ES%22%2C%22continent%22:%22EU%22}; csrf_token_7edb4307044064c5213d44940aa94f48ab88fe0b5ead052fbb75851a981aa6c4=WUhtlDDhR4uxQnsEXOMPBm7g1FOj9RECs3OMmRh2kHM=; fandom_session=MTc3MjIwODAxMXxGSl9JQUx1YWxNZmtsWU50NjhTbHZGWEN0d3JwbEprblhBUzVSTUNxNmVsYjE1TThxRlFBMkx6VUlOVGNvMnpvTldjSGtkSG1kTHJvVWRkcEhZOFIzZ0t5SjlHMTBYZGxjWVQxRDc4Y045ZEpwVmc1Ri1NYXNHRVk4dlMwVVN6NkdscVA4ckJaRGppc1dtTjJrN1ZSUFZ2R1NUMHcwNEtNQjZjeTM3OEZScUhWWlhYZWI0M21aRzJQYUo3S0hxMW9oWU5BVDlzMHhNcVdaUmpyR3l0OV9kQkFLWG93cEROQTZuQ1RJTVk0ZW5pRkxIRENRTkctSkU2T21OUkl5bVVfb1dmTHBpazFackdEd2YtQTJjc1Z8CDwpld0LGuQXDiEgSulsFHKfgSqQk0eDnLbQDnVty5g=; cf_clearance=RZYlgTyXRq4z9_tvnuR6SSVBnyeCvmeVztHKYgZyKyM-1772210450-1.2.1.1-053OqMFwETU1SPNpCGKpUgTisLoPPm3wY5gmZ_3ASpsilx7Itu5d1n54Jgo.a4.yxcP2oWbk1beah5jwJaYynCpPB0orsPqx5Bl_rtNIAiNwiXWZw3H_WWZTK.5IGbX9FlvFBYjyWPlPa.dGdU3cAW2ns0la04lt.9aIo6hfeDhZ1T_oHNVfVyJsb5I8GPc2wFGLPN.DgK29QpWX5grOa5VSaHqYQgV3KCnRnKMU9bA; __cf_bm=cciPxjAC.b5vokkRLHBYlpD6CDGvxrJuMVQcmDako1s-1772217511-1.0.1.1-eN9AopuYZDmd.BQdurja5xDDRPMO0lNgeY0cV1mMF4u4ctqG2vpQAy3SBUn7Jrdj5KVeT6VCicJey8LzTm4BkqZFwBXXvRJtj3M9YRByQ90; leftPanelOpen=0";

    public void importarJugadoresDeLeaguepedia() {
        RestTemplate restTemplate = new RestTemplate();

        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery")
                .queryParam("format", "json")
                .queryParam("tables", "TournamentPlayers=TP,Players=P")
                .queryParam("fields", "TP.Player=ID,P.Name=Name,TP.Role=Role,TP.Team=Team")
                .queryParam("where", "TP.OverviewPage LIKE 'LEC/2026 Season/Spring%'")
                .queryParam("join_on", "TP.Player=P.ID")
                .queryParam("limit", "200")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
        headers.set(HttpHeaders.COOKIE, MIS_COOKIES);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            System.out.println("🛰️ [JUGADOR] Conectando con Leaguepedia (Identity Verified)...");
            ResponseEntity<LeaguepediaResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity,
                    LeaguepediaResponse.class);
            LeaguepediaResponse responseBody = response.getBody();

            if (responseBody != null && responseBody.getCargoquery() != null
                    && !responseBody.getCargoquery().isEmpty()) {
                System.out.println(
                        "✅ [JUGADOR] API respondió con " + responseBody.getCargoquery().size() + " jugadores.");
                for (LeaguepediaResponse.CargoItem item : responseBody.getCargoquery()) {
                    LeaguepediaResponse.PlayerTitle title = item.getTitle();
                    String rawNickname = title.getId();
                    String nombreReal = title.getName();
                    String rol = title.getRole();

                    if (rawNickname == null || rol == null || rol.equalsIgnoreCase("Coach"))
                        continue;

                    String nickname = rawNickname.split(" \\(")[0].trim();
                    Optional<Jugador> existe = jugadorRepository.findByNickname(nickname);

                    if (existe.isEmpty()) {
                        Jugador nuevoJugador = new Jugador();
                        nuevoJugador.setNickname(nickname);
                        nuevoJugador.setNombreReal(nombreReal != null && !nombreReal.isEmpty() ? nombreReal : nickname);
                        nuevoJugador.setRol(rol);
                        nuevoJugador.setPrecioBase(5000.0);

                        // Usamos el método centralizado de PuntuacionService que ya tiene la lógica HD
                        EquipoLec el = puntuacionService.getOrCreateEquipo(title.getTeam());
                        nuevoJugador.setEquipoLec(el);

                        jugadorRepository.save(nuevoJugador);
                        System.out.println("   👤 Importado: " + nickname + " ["
                                + (el != null ? el.getAbreviatura() : "???") + "]");
                    }
                }
                System.out.println("🏁 [JUGADOR] Importación de 2026 completada.");
            } else {
                System.out.println("⚠️ [JUGADOR] La respuesta de la API está vacía.");
            }
        } catch (Exception e) {
            System.err.println("❌ [JUGADOR] Error crítico: " + e.getMessage());
        }
    }

    public List<Jugador> obtenerTodosLosJugadores() {
        return jugadorRepository.findAll();
    }

    public List<JugadorPuntuacionTotalDTO> obtenerRankingJugadores() {
        return jugadorRepository.findAllWithTotalPoints();
    }

    public List<JugadorEstadisticaDTO> obtenerEstadisticasJugador(Long idJugador) {
        List<EstadisticaPartido> estadisticas = estadisticaPartidoRepository.findByJugadorId(idJugador);
        return estadisticas.stream().map(e -> {
            JugadorEstadisticaDTO dto = new JugadorEstadisticaDTO();
            dto.setGameId(e.getPartido().getGameId());
            dto.setMatchName(e.getPartido().getTeam1() + " vs " + e.getPartido().getTeam2());
            dto.setTeam1(e.getPartido().getTeam1());
            dto.setTeam2(e.getPartido().getTeam2());
            dto.setFecha(e.getPartido().getFechaUtc() != null ? e.getPartido().getFechaUtc().toString() : null);
            dto.setSemana(e.getPartido().getJornada() != null ? e.getPartido().getJornada().getNumeroSemana() : null);
            dto.setSerieId(e.getPartido().getSerieId());

            if (e.getJugador().getEquipoLec() != null && e.getPartido().getWinTeam() != null) {
                dto.setResultado(
                        e.getJugador().getEquipoLec().getNombre().equalsIgnoreCase(e.getPartido().getWinTeam()) ? "WIN"
                                : "LOSS");
            }

            dto.setKills(e.getKills());
            dto.setDeaths(e.getDeaths());
            dto.setAssists(e.getAssists());
            dto.setCs(e.getCs());
            dto.setPuntosGenerados(e.getPuntosGenerados());
            dto.setPuntosReales(e.getPuntosReales());
            return dto;
        }).collect(Collectors.toList());
    }

    public JugadorDetalleDTO obtenerDetalleJugadorConPropietario(Long id, Long ligaId) {
        Jugador j = jugadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado"));

        JugadorDetalleDTO dto = new JugadorDetalleDTO();
        dto.setId(j.getId());
        dto.setNickname(j.getNickname());
        dto.setNombreReal(j.getNombreReal());
        dto.setRol(j.getRol());
        dto.setPrecioBase(j.getPrecioBase());
        dto.setImagenUrl(j.getImagenUrl());
        
        if (j.getEquipoLec() != null) {
            dto.setEquipoLecNombre(j.getEquipoLec().getNombre());
            dto.setEquipoLecLogo(j.getEquipoLec().getLogoUrl());
        }

        // Buscar propietario en la liga
        List<Plantilla> propiedad = plantillaRepository.findByJugadorId(j.getId());
        for (Plantilla p : propiedad) {
            if (p.getEquipo().getLiga().getId().equals(ligaId)) {
                dto.setPropietarioNickname(p.getEquipo().getUsuario().getNickname());
                dto.setPropietarioEquipoId(p.getEquipo().getId());
                break;
            }
        }

        return dto;
    }

    public Jugador obtenerDetalleJugador(Long id) {
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado con ID: " + id));
    }
}
