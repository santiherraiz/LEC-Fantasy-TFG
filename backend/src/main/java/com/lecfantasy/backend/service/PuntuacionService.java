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
import org.springframework.scheduling.annotation.Async;
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

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Transactional
    public void hacerSnapshotSemana(int semana) {
        System.out.println("📸 Realizando snapshot para la semana " + semana);

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

        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery")
                .queryParam("format", "json")
                .queryParam("tables", "ScoreboardGames")
                .queryParam("fields", "Team1,Team2,WinTeam,LossTeam,DateTime_UTC,GameId,Tournament")
                .queryParam("where", "Tournament LIKE 'LEC 2026 Spring%'") // Más flexible
                .queryParam("limit", "500")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LECFantasyApp/1.0 (Proyecto TFG; santiherra06@gmail.com)");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> responseRaw = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            PartidoLeaguepediaDTO body = mapper.readValue(responseRaw.getBody(), PartidoLeaguepediaDTO.class);

            if (body != null && body.getCargoquery() != null) {
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

                    String gid = data.getGameId();
                    String matchId = gid.contains("_") ? gid.substring(0, gid.lastIndexOf("_")) : gid;
                    partido.setSerieId(matchId);

                    int semanaNum = 1;
                    if (gid.toLowerCase().contains("week")) {
                        try {
                            int weekIdx = gid.toLowerCase().indexOf("week");
                            String afterWeek = gid.substring(weekIdx + 4).trim();
                            StringBuilder sb = new StringBuilder();
                            for (char c : afterWeek.toCharArray()) {
                                if (Character.isDigit(c))
                                    sb.append(c);
                                else if (sb.length() > 0)
                                    break;
                            }
                            if (sb.length() > 0)
                                semanaNum = Integer.parseInt(sb.toString());
                        } catch (Exception e) {
                        }
                    }
                    partido.setSemana(semanaNum);
                    partidoRepository.save(partido);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static final double PUNTOS_POR_KILL = 3.0;
    private static final double PUNTOS_POR_ASSIST = 1.5;
    private static final double PUNTOS_POR_DEATH = -1.0;
    private static final double PUNTOS_POR_CS = 0.02;
    private static final double PUNTOS_POR_VICTORIA = 5.0;

    public double calcularPuntosPartido(int kills, int deaths, int assists, int cs, boolean victoria) {
        return (kills * PUNTOS_POR_KILL) + (assists * PUNTOS_POR_ASSIST) + (deaths * PUNTOS_POR_DEATH)
                + (cs * PUNTOS_POR_CS) + (victoria ? PUNTOS_POR_VICTORIA : 0.0);
    }

    @Transactional
    public String calcularPuntosSemana(int semana) {
        List<Partido> partidosPendientes = partidoRepository.findBySemana(semana).stream()
                .filter(p -> !p.isPuntosCalculados())
                .collect(Collectors.toList());

        if (partidosPendientes.isEmpty()) {
            return "✅ Todos los partidos de la semana " + semana + " ya han sido procesados.";
        }

        List<EstadisticaPartido> statsNuevas = estadisticaPartidoRepository.findByPartidoSemana(semana).stream()
                .filter(s -> !s.getPartido().isPuntosCalculados())
                .collect(Collectors.toList());

        if (statsNuevas.isEmpty()) {
            return "⚠️ No hay estadísticas nuevas para procesar en la semana " + semana;
        }

        Map<String, Map<Long, List<EstadisticaPartido>>> agrupado = statsNuevas.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getPartido().getSerieId(),
                        Collectors.groupingBy(s -> s.getJugador().getId())));

        Map<Long, Double> puntosAcumuladosPorJugador = new HashMap<>();

        for (String serieId : agrupado.keySet()) {
            Map<Long, List<EstadisticaPartido>> jugadoresEnSerie = agrupado.get(serieId);
            for (Long jugadorId : jugadoresEnSerie.keySet()) {
                List<EstadisticaPartido> mapas = jugadoresEnSerie.get(jugadorId);
                double sumaPuntosBrutos = 0;
                for (EstadisticaPartido mapStat : mapas) {
                    boolean esVictoria = mapStat.getJugador().getEquipoLec() != null &&
                            mapStat.getJugador().getEquipoLec().equalsIgnoreCase(mapStat.getPartido().getWinTeam());
                    double ptsBrutos = calcularPuntosPartido(mapStat.getKills(), mapStat.getDeaths(),
                            mapStat.getAssists(), mapStat.getCs(), esVictoria);
                    sumaPuntosBrutos += ptsBrutos;
                    mapStat.setPuntosGenerados(ptsBrutos);
                    estadisticaPartidoRepository.save(mapStat);
                }
                double mediaSerie = sumaPuntosBrutos / mapas.size();
                puntosAcumuladosPorJugador.put(jugadorId,
                        puntosAcumuladosPorJugador.getOrDefault(jugadorId, 0.0) + mediaSerie);
            }
        }

        List<HistoricoAlineacion> snapshot = historicoAlineacionRepository.findBySemana(semana);
        if (snapshot.isEmpty())
            return "Error: No hay snapshot para la semana " + semana;

        int equiposActualizados = 0;
        for (HistoricoAlineacion h : snapshot) {
            if (h.getEstado() == EstadoAlineacion.TITULAR) {
                Double puntosGana = puntosAcumuladosPorJugador.get(h.getJugador().getId());
                if (puntosGana != null) { // Quitamos > 0 para permitir puntos negativos
                    Equipo e = h.getEquipo();
                    e.setPuntuacionTotal(e.getPuntuacionTotal() + puntosGana);
                    equipoRepository.save(e);
                    equiposActualizados++;
                }
            }
        }
        for (Partido p : partidosPendientes) {
            p.setPuntosCalculados(true);
            partidoRepository.save(p);
        }
        return "Cálculo finalizado. " + equiposActualizados + " equipos actualizados con nuevos partidos.";
    }

    @Async
    public void importarEstadisticasDeLeaguepedia() {
        List<Partido> partidosPendientes = partidoRepository.findByPuntosCalculadosFalse();
        if (partidosPendientes.isEmpty()) {
            System.out.println("✅ No hay partidos pendientes de importar estadísticas.");
            return;
        }

        System.out.println(
                "🚀 [ASYNC] Iniciando importación MASIVA de " + partidosPendientes.size() + " partidos (1 a 1)...");

        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // 🔥 TU PASE VIP DE CLOUDFLARE 🔥
        // (Pega aquí tu string de cookies completo como hicimos antes)
        String misCookies = "exp_bucket=v8-30; exp_bucket_2=v5-71; Geo=OK; addtl_consent=1~; euconsent-v2=CPt3fQAPt3fQACNAFAENDLCgAAAAAAAAACiQAAAOCgDAB-AIsAZ8A6QDBAHBAAAA.YAAAAAAAAAAA; tracking-opt-in-status=rejected; eb=21; wikia_beacon_id=UoF5QNPsWU; _b2=33lVvLjkgb.1772207254112; wikia_session_id=YoPddHOEPf; tech-update-disable-banner-global=1; Geo={%22region%22:%22VC%22%2C%22city%22:%22valencia%22%2C%22country_name%22:%22spain%22%2C%22country%22:%22ES%22%2C%22continent%22:%22EU%22}; csrf_token_7edb4307044064c5213d44940aa94f48ab88fe0b5ead052fbb75851a981aa6c4=WUhtlDDhR4uxQnsEXOMPBm7g1FOj9RECs3OMmRh2kHM=; fandom_session=MTc3MjIwODAxMXxGSl9JQUx1YWxNZmtsWU50NjhTbHZGWEN0d3JwbEprblhBUzVSTUNxNmVsYjE1TThxRlFBMkx6VUlOVGNvMnpvTldjSGtkSG1kTHJvVWRkcEhZOFIzZ0t5SjlHMTBYZGxjWVQxRDc4Y045ZEpwVmc1Ri1NYXNHRVk4dlMwVVN6NkdscVA4ckJaRGppc1dtTjJrN1ZSUFZ2R1NUMHcwNEtNQjZjeTM3OEZScUhWWlhYZWI0M21aRzJQYUo3S0hxMW9oWU5BVDlzMHhNcVdaUmpyR3l0OV9kQkFLWG93cEROQTZuQ1RJTVk0ZW5pRkxIRENRTkctSkU2T21OUkl5bVVfb1dmTHBpazFackdEd2YtQTJjc1Z8CDwpld0LGuQXDiEgSulsFHKfgSqQk0eDnLbQDnVty5g=; cf_clearance=RZYlgTyXRq4z9_tvnuR6SSVBnyeCvmeVztHKYgZyKyM-1772210450-1.2.1.1-053OqMFwETU1SPNpCGKpUgTisLoPPm3wY5gmZ_3ASpsilx7Itu5d1n54Jgo.a4.yxcP2oWbk1beah5jwJaYynCpPB0orsPqx5Bl_rtNIAiNwiXWZw3H_WWZTK.5IGbX9FlvFBYjyWPlPa.dGdU3cAW2ns0la04lt.9aIo6hfeDhZ1T_oHNVfVyJsb5I8GPc2wFGLPN.DgK29QpWX5grOa5VSaHqYQgV3KCnRnKMU9bA; __cf_bm=cciPxjAC.b5vokkRLHBYlpD6CDGvxrJuMVQcmDako1s-1772217511-1.0.1.1-eN9AopuYZDmd.BQdurja5xDDRPMO0lNgeY0cV1mMF4u4ctqG2vpQAy3SBUn7Jrdj5KVeT6VCicJey8LzTm4BkqZFwBXXvRJtj3M9YRByQ90; leftPanelOpen=0";

        int procesados = 0;

        // Recorremos la lista completa de partidos pendientes
        for (Partido partido : partidosPendientes) {
            try {
                String gameId = partido.getGameId();
                String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json" +
                        "&tables=ScoreboardGames=SG,ScoreboardPlayers=SP" +
                        "&fields=SP.GameId,SP.Link,SP.Kills,SP.Deaths,SP.Assists,SP.CS,SP.Gold" +
                        "&join_on=SG.GameId=SP.GameId" +
                        "&where=SG.GameId='{gameId}'" +
                        "&limit=500";

                System.out.println("🔍 [FANDOM] Petición (JOIN) para partido " + (procesados + 1) + "/"
                        + partidosPendientes.size() + ": " + gameId);

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
                headers.set("Accept", "application/json, text/javascript, */*; q=0.01");
                headers.set("Referer", "https://lol.fandom.com/wiki/Special:CargoTables/ScoreboardPlayers");
                headers.set(HttpHeaders.COOKIE, misCookies);

                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> responseRaw = null;
                String body = null;
                int retries = 2;

                while (retries >= 0) {
                    responseRaw = restTemplate.exchange(url, HttpMethod.GET, entity, String.class, gameId);
                    body = responseRaw.getBody();

                    if (body != null && body.contains("\"ratelimited\"")) {
                        if (retries > 0) {
                            System.err.println("⚠️ Ratelimit detectado. Esperando 40s antes de reintentar...");
                            try {
                                Thread.sleep(40000);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                            retries--;
                        } else {
                            System.err.println("⚠️ Ratelimit persistente. Abortando proceso para proteger la IP.");
                            return;
                        }
                    } else {
                        break;
                    }
                }

                if (body == null || body.contains("\"error\"") || body.contains("MWException")) {
                    System.err.println("❌ Error en la API para partido " + gameId + ": " + body);
                    continue;
                }

                MatchDataResponse responseObj = mapper.readValue(body, MatchDataResponse.class);

                if (responseObj.getCargoquery() != null) {
                    final MatchDataResponse responseFinal = responseObj;

                    Boolean exito = transactionTemplate.execute(status -> {
                        boolean actualizoStats = false;
                        for (MatchDataResponse.CargoItem item : responseFinal.getCargoquery()) {
                            MatchDataResponse.MatchStats stats = item.getTitle();
                            String rawNickname = stats.getNickname();
                            if (rawNickname == null)
                                continue;

                            String nicknameLimpio = rawNickname.split(" \\(")[0].trim();
                            Optional<Jugador> jugadorOpt = jugadorRepository.findByNickname(nicknameLimpio);

                            if (jugadorOpt.isPresent()) {
                                Jugador jugador = jugadorOpt.get();
                                if (!estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(partido.getGameId(),
                                        jugador.getId())) {
                                    EstadisticaPartido ep = new EstadisticaPartido();
                                    ep.setPartido(partido);
                                    ep.setJugador(jugador);

                                    ep.setKills(parsearEnteroSeguro(stats.getKills()));
                                    ep.setDeaths(parsearEnteroSeguro(stats.getDeaths()));
                                    ep.setAssists(parsearEnteroSeguro(stats.getAssists()));
                                    ep.setCs(parsearEnteroSeguro(stats.getCs()));

                                    String goldLimpio = stats.getGold() != null ? stats.getGold().replace(",", "")
                                            : "0";
                                    ep.setGold(parsearEnteroSeguro(goldLimpio));
                                    ep.setGoldEarned(Double.parseDouble(goldLimpio));

                                    ep.setDamageDealt(0.0);
                                    ep.setDamageTaken(0.0);
                                    ep.setVisionScore(0.0);
                                    ep.setPentaKills(0);

                                    boolean esVictoria = jugador.getEquipoLec() != null &&
                                            jugador.getEquipoLec().equalsIgnoreCase(partido.getWinTeam());

                                    ep.setPuntosGenerados(calcularPuntosPartido(ep.getKills(), ep.getDeaths(),
                                            ep.getAssists(), ep.getCs(), esVictoria));
                                    estadisticaPartidoRepository.saveAndFlush(ep);
                                    actualizoStats = true;
                                }
                            }
                        }
                        if (actualizoStats) {
                            partido.setPuntosCalculados(true);
                            partidoRepository.saveAndFlush(partido);
                            return true;
                        }
                        return false;
                    });

                    if (Boolean.TRUE.equals(exito)) {
                        procesados++;
                    }
                }

                // Bajamos el tiempo a 5 segundos
                System.out.println("⏳ Esperando 5s para el próximo partido...");
                Thread.sleep(5000);

            } catch (Exception e) {
                System.err.println("❌ Error crítico procesando partido " + partido.getGameId() + ": " + e.getMessage());
            }
        }
        System.out.println("✅ [OK] Proceso masivo terminado. " + procesados + " partidos actualizados.");
    }

    // Método auxiliar para evitar caídas por cadenas vacías o mal formadas de la
    // API
    private int parsearEnteroSeguro(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return 0;
        }
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException e) {
            System.err.println("⚠️ Valor no numérico recibido de Fandom: '" + valor + "'. Asignando 0.");
            return 0;
        }
    }
}