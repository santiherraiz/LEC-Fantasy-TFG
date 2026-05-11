package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.MatchDataResponse;
import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import com.lecfantasy.backend.dto.PartidoLeaguepediaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;

@Service
public class PuntuacionService {

    @Autowired private PlantillaRepository plantillaRepository;
    @Autowired private EquipoRepository equipoRepository;
    @Autowired private PartidoRepository partidoRepository;
    @Autowired private EstadisticaPartidoRepository estadisticaPartidoRepository;
    @Autowired private JugadorRepository jugadorRepository;
    @Autowired private HistoricoAlineacionRepository historicoAlineacionRepository;
    @Autowired private JornadaRepository jornadaRepository;
    @Autowired private EquipoLecRepository equipoLecRepository;
    @Autowired private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private final String MIS_COOKIES = "exp_bucket=v8-30; exp_bucket_2=v5-71; Geo=OK; addtl_consent=1~; euconsent-v2=CPt3fQAPt3fQACNAFAENDLCgAAAAAAAAACiQAAAOCgDAB-AIsAZ8A6QDBAHBAAAA.YAAAAAAAAAAA; tracking-opt-in-status=rejected; eb=21; wikia_beacon_id=UoF5QNPsWU; _b2=33lVvLjkgb.1772207254112; wikia_session_id=YoPddHOEPf; tech-update-disable-banner-global=1; Geo={%22region%22:%22VC%22%2C%22city%22:%22valencia%22%2C%22country_name%22:%22spain%22%2C%22country%22:%22ES%22%2C%22continent%22:%22EU%22}; csrf_token_7edb4307044064c5213d44940aa94f48ab88fe0b5ead052fbb75851a981aa6c4=WUhtlDDhR4uxQnsEXOMPBm7g1FOj9RECs3OMmRh2kHM=; fandom_session=MTc3MjIwODAxMXxGSl9JQUx1YWxNZmtsWU50NjhTbHZGWEN0d3JwbEprblhBUzVSTUNxNmVsYjE1TThxRlFBMkx6VUlOVGNvMnpvTldjSGtkSG1kTHJvVWRkcEhZOFIzZ0t5SjlHMTBYZGxjWVQxRDc4Y045ZEpwVmc1Ri1NYXNHRVk4dlMwVVN6NkdscVA4ckJaRGppc1dtTjJrN1ZSUFZ2R1NUMHcwNEtNQjZjeTM3OEZScUhWWlhYZWI0M21aRzJQYUo3S0hxMW9oWU5BVDlzMHhNcVdaUmpyR3l0OV9kQkFLWG93cEROQTZuQ1RJTVk0ZW5pRkxIRENRTkctSkU2T21OUkl5bVVfb1dmTHBpazFackdEd2YtQTJjc1Z8CDwpld0LGuQXDiEgSulsFHKfgSqQk0eDnLbQDnVty5g=; cf_clearance=RZYlgTyXRq4z9_tvnuR6SSVBnyeCvmeVztHKYgZyKyM-1772210450-1.2.1.1-053OqMFwETU1SPNpCGKpUgTisLoPPm3wY5gmZ_3ASpsilx7Itu5d1n54Jgo.a4.yxcP2oWbk1beah5jwJaYynCpPB0orsPqx5Bl_rtNIAiNwiXWZw3H_WWZTK.5IGbX9FlvFBYjyWPlPa.dGdU3cAW2ns0la04lt.9aIo6hfeDhZ1T_oHNVfVyJsb5I8GPc2wFGLPN.DgK29QpWX5grOa5VSaHqYQgV3KCnRnKMU9bA; __cf_bm=cciPxjAC.b5vokkRLHBYlpD6CDGvxrJuMVQcmDako1s-1772217511-1.0.1.1-eN9AopuYZDmd.BQdurja5xDDRPMO0lNgeY0cV1mMF4u4ctqG2vpQAy3SBUn7Jrdj5KVeT6VCicJey8LzTm4BkqZFwBXXvRJtj3M9YRByQ90; leftPanelOpen=0";

    public EquipoLec getOrCreateEquipo(String nombre) {
        if (nombre == null || nombre.isEmpty()) return null;
        
        Optional<EquipoLec> existente = equipoLecRepository.findByNombre(nombre);
        if (existente.isPresent()) return existente.get();

        System.out.println("🛰️ [EQUIPO] Nuevo equipo detectado: " + nombre + ". Consultando Leaguepedia...");
        
        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery")
                .queryParam("format", "json")
                .queryParam("tables", "Teams")
                .queryParam("fields", "Short,Image")
                .queryParam("where", "Name = '" + nombre + "'")
                .build()
                .toUriString();

        EquipoLec e = new EquipoLec();
        e.setNombre(nombre);
        
        try {
            RestTemplate rt = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            headers.set(HttpHeaders.COOKIE, MIS_COOKIES);
            
            ResponseEntity<Map<String, Object>> response = rt.exchange(
                url, 
                HttpMethod.GET, 
                new HttpEntity<>(headers), 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("cargoquery")) {
                List<?> cargoquery = (List<?>) body.get("cargoquery");
                if (cargoquery != null && !cargoquery.isEmpty()) {
                    Map<?, ?> firstItem = (Map<?, ?>) cargoquery.get(0);
                    Map<?, ?> title = (Map<?, ?>) firstItem.get("title");
                    
                    String shortName = (String) title.get("Short");
                    String fileName = (String) title.get("Image");
                    
                    e.setAbreviatura(shortName);
                    if (fileName != null && !fileName.isEmpty()) {
                        e.setLogoUrl("https://lol.fandom.com/wiki/Special:FilePath/" + fileName);
                    }
                } else {
                    e.setAbreviatura(nombre.substring(0, Math.min(nombre.length(), 3)).toUpperCase());
                }
            }
        } catch (Exception ex) {
            e.setAbreviatura(nombre.substring(0, Math.min(nombre.length(), 3)).toUpperCase());
        }

        return equipoLecRepository.save(e);
    }

    public int obtenerSemanaActual() {
        // Primero, intentamos obtener la semana más alta que ya tenga estadísticas calculadas
        Integer maxSemanaConStats = estadisticaPartidoRepository.findMaxSemanaConStats();
        if (maxSemanaConStats != null && maxSemanaConStats > 0) {
            return maxSemanaConStats;
        }

        // Si no hay estadísticas, devolvemos la primera jornada que no esté finalizada
        return jornadaRepository.findAll().stream()
                .filter(j -> j.getEstado() != JornadaEstado.FINALIZADA)
                .mapToInt(Jornada::getNumeroSemana)
                .min().orElse(1);
    }

    @Transactional
    public void hacerSnapshotSemana(int numeroSemana) {
        Jornada jornada = jornadaRepository.findByNumeroSemana(numeroSemana)
                .orElseThrow(() -> new RuntimeException("Jornada no encontrada: " + numeroSemana));
        
        List<HistoricoAlineacion> previo = historicoAlineacionRepository.findByJornada(jornada);
        if (!previo.isEmpty()) historicoAlineacionRepository.deleteAll(previo);

        List<Plantilla> todasLasPlantillas = plantillaRepository.findAll();
        for (Plantilla p : todasLasPlantillas) {
            HistoricoAlineacion h = new HistoricoAlineacion();
            h.setEquipo(p.getEquipo());
            h.setJugador(p.getJugador());
            h.setJornada(jornada);
            h.setEstado(p.getEstado());
            h.setPuntosSemanales(0.0);
            historicoAlineacionRepository.save(h);
        }
    }

    public long contarPartidosPendientes(Jornada jornada) {
        return partidoRepository.findByJornada(jornada).stream()
                .filter(p -> !p.isPuntosCalculados()).count();
    }

    @Transactional
    public void resetTotal() {
        // Borramos todo lo relacionado con puntos y stats para empezar de cero
        historicoAlineacionRepository.findAll().forEach(h -> { h.setPuntosSemanales(0.0); historicoAlineacionRepository.save(h); });
        equipoRepository.findAll().forEach(e -> { e.setPuntuacionTotal(0.0); equipoRepository.save(e); });
        estadisticaPartidoRepository.deleteAllInBatch();
        partidoRepository.resetAllEstadisticasImportadas();
        partidoRepository.resetAllPuntosCalculados();
    }

    @Transactional
    public String calcularPuntos() {
        // 1. Identificar todas las series que tienen al menos un mapa nuevo
        List<String> seriesPendientes = partidoRepository.findByPuntosCalculadosFalse().stream()
                .filter(p -> p.isEstadisticasImportadas() && p.getJornada() != null)
                .map(Partido::getSerieId)
                .distinct()
                .collect(Collectors.toList());

        if (seriesPendientes.isEmpty()) return "✅ Sin series nuevas.";

        int seriesProcesadas = 0;
        for (String serieId : seriesPendientes) {
            List<Partido> mapasSerie = partidoRepository.findBySerieId(serieId);
            
            boolean todosImportados = mapasSerie.stream().allMatch(Partido::isEstadisticasImportadas);
            if (!todosImportados) continue;

            Map<String, Long> victorias = mapasSerie.stream()
                    .filter(m -> m.getWinTeam() != null)
                    .collect(Collectors.groupingBy(Partido::getWinTeam, Collectors.counting()));
            
            boolean terminada = victorias.values().stream().anyMatch(v -> v >= 2) || mapasSerie.size() == 1;
            if (!terminada && mapasSerie.size() < 3) continue;

            List<EstadisticaPartido> allStatsSerie = estadisticaPartidoRepository.findByPartidoSerieId(serieId);
            Map<Long, List<EstadisticaPartido>> porJugador = allStatsSerie.stream()
                    .collect(Collectors.groupingBy(s -> s.getJugador().getId()));

            for (List<EstadisticaPartido> statsJugador : porJugador.values()) {
                double sumaPuntosReales = 0;
                for (EstadisticaPartido s : statsJugador) {
                    boolean victoria = s.getJugador().getEquipoLec() != null &&
                            s.getJugador().getEquipoLec().getNombre().equalsIgnoreCase(s.getPartido().getWinTeam());
                    
                    // Cálculo de puntos REALES del mapa (estándar)
                    double ptsReales = (s.getKills() * 3.0) + (s.getAssists() * 1.5) + (s.getDeaths() * -1.0) + (s.getCs() * 0.02) + (victoria ? 5.0 : 0.0);
                    s.setPuntosReales(ptsReales);
                    sumaPuntosReales += ptsReales;
                }
                
                // 1. Puntos FANTASY de la serie = (Suma Reales / Num Mapas) + ACE
                double mediaSerie = Math.round(sumaPuntosReales / mapasSerie.size());
                
                String equipoJugador = statsJugador.get(0).getJugador().getEquipoLec() != null ? 
                        statsJugador.get(0).getJugador().getEquipoLec().getNombre() : "";
                boolean wonSeries = !equipoJugador.isEmpty() && victorias.getOrDefault(equipoJugador, 0L) >= 2;
                boolean ace = (mapasSerie.size() == 2 && wonSeries);
                
                double puntosFantasySerie = mediaSerie + (ace ? 5.0 : 0.0);
                
                // 2. Repartimos los puntos fantasy proporcionalmente entre los mapas para facilitar los SUM() en SQL
                // Pero guardamos los Puntos Reales intactos para la UI
                double factor = (sumaPuntosReales == 0) ? 0 : puntosFantasySerie / sumaPuntosReales;
                
                for (EstadisticaPartido s : statsJugador) {
                    s.setPuntosGenerados(s.getPuntosReales() * factor);
                    estadisticaPartidoRepository.save(s);
                }
            }
            
            for (Partido p : mapasSerie) {
                p.setPuntosCalculados(true);
                partidoRepository.save(p);
            }
            seriesProcesadas++;
        }
        
        actualizarRankingGlobal();
        return "Cálculo finalizado para " + seriesProcesadas + " series.";
    }

    private void actualizarRankingGlobal() {
        List<HistoricoAlineacion> todosLosHistoricos = historicoAlineacionRepository.findAll();
        Map<Equipo, Double> nuevosTotales = new HashMap<>();

        for (HistoricoAlineacion ha : todosLosHistoricos) {
            if (ha.getEstado() == EstadoAlineacion.TITULAR) {
                double pts = calcularPuntosJugadorEnJornada(ha.getJugador().getId(), ha.getJornada().getId());
                ha.setPuntosSemanales(pts);
                historicoAlineacionRepository.save(ha);
                nuevosTotales.put(ha.getEquipo(), nuevosTotales.getOrDefault(ha.getEquipo(), 0.0) + pts);
            }
        }

        nuevosTotales.forEach((equipo, total) -> {
            equipo.setPuntuacionTotal(total);
            equipoRepository.save(equipo);
        });
    }

    private double calcularPuntosJugadorEnJornada(Long jugadorId, Long jornadaId) {
        List<EstadisticaPartido> stats = estadisticaPartidoRepository.findByJugadorId(jugadorId).stream()
                .filter(s -> s.getPartido().getJornada() != null && s.getPartido().getJornada().getId().equals(jornadaId))
                .collect(Collectors.toList());
        if (stats.isEmpty()) return 0.0;
        
        Map<String, List<EstadisticaPartido>> porSerie = stats.stream().collect(Collectors.groupingBy(s -> s.getPartido().getSerieId()));
        double sumaSeries = 0;
        for (List<EstadisticaPartido> mapas : porSerie.values()) {
            sumaSeries += mapas.stream().mapToDouble(EstadisticaPartido::getPuntosGenerados).sum();
        }
        // Ahora devolvemos la SUMA de las series en la jornada, no la media
        return Math.round(sumaSeries);
    }

    public int calcularPuntosPartido(int k, int d, int a, int cs, boolean v) {
        return (int) Math.round((k * 3.0) + (a * 1.5) + (d * -1.0) + (cs * 0.02) + (v ? 5.0 : 0));
    }

    @Transactional
    public void resetImportaciones() {
        partidoRepository.resetAllEstadisticasImportadas();
        estadisticaPartidoRepository.deleteAllInBatch();
    }

    @Transactional
    public void resetCalculos() {
        partidoRepository.resetAllPuntosCalculados();
        equipoRepository.findAll().forEach(e -> { e.setPuntuacionTotal(0.0); equipoRepository.save(e); });
        historicoAlineacionRepository.findAll().forEach(h -> { h.setPuntosSemanales(0.0); historicoAlineacionRepository.save(h); });
    }

    @Transactional
    public void limpiarJornada(int numeroSemana) {
        jornadaRepository.findByNumeroSemana(numeroSemana).ifPresent(j -> {
            List<HistoricoAlineacion> historicos = historicoAlineacionRepository.findByJornada(j);
            historicoAlineacionRepository.deleteAll(historicos);
            
            List<Partido> partidos = partidoRepository.findByJornada(j);
            for (Partido p : partidos) {
                List<EstadisticaPartido> stats = estadisticaPartidoRepository.findByPartidoGameId(p.getGameId());
                estadisticaPartidoRepository.deleteAll(stats);
                partidoRepository.delete(p);
            }
        });
    }

    public void importarPartidosDeLeaguepedia() {
        RestTemplate rt = new RestTemplate();
        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery").queryParam("format", "json")
                .queryParam("tables", "ScoreboardGames")
                .queryParam("fields", "Team1,Team2,WinTeam,LossTeam,DateTime_UTC,GameId,Tournament")
                .queryParam("where", "Tournament LIKE 'LEC 2026 Spring%'")
                .queryParam("limit", "500").build().toUriString();
        HttpHeaders h = new HttpHeaders(); h.set("User-Agent", "Mozilla/5.0"); h.set(HttpHeaders.COOKIE, MIS_COOKIES);
        try {
            ResponseEntity<String> res = rt.exchange(url, HttpMethod.GET, new HttpEntity<>(h), String.class);
            ObjectMapper m = new ObjectMapper(); m.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            PartidoLeaguepediaDTO body = m.readValue(res.getBody(), PartidoLeaguepediaDTO.class);
            if (body != null && body.getCargoquery() != null) {
                for (PartidoLeaguepediaDTO.CargoItem item : body.getCargoquery()) {
                    PartidoLeaguepediaDTO.PartidoData d = item.getTitle();
                    Optional<Partido> po = partidoRepository.findById(d.getGameId());
                    Partido p = po.orElse(new Partido());
                    p.setGameId(d.getGameId()); p.setTeam1(d.getTeam1()); p.setTeam2(d.getTeam2());
                    p.setWinTeam(d.getWinTeam()); p.setLossTeam(d.getLossTeam()); 
                    
                    p.setTeam1Entity(getOrCreateEquipo(d.getTeam1()));
                    p.setTeam2Entity(getOrCreateEquipo(d.getTeam2()));
                    p.setWinTeamEntity(getOrCreateEquipo(d.getWinTeam()));
                    p.setLossTeamEntity(getOrCreateEquipo(d.getLossTeam()));

                    if (d.getDateTimeUtc() != null) {
                        p.setFechaUtc(LocalDateTime.parse(d.getDateTimeUtc().replace(" ", "T")));
                    }
                    p.setSerieId(d.getGameId().contains("_") ? d.getGameId().substring(0, d.getGameId().lastIndexOf("_")) : d.getGameId());
                    jornadaRepository.findByNumeroSemana(extraerSemana(d.getGameId())).ifPresent(p::setJornada);
                    partidoRepository.save(p);
                }
            }
        } catch (Exception e) {}
    }

    private int extraerSemana(String gid) {
        if (gid.toLowerCase().contains("week")) {
            try {
                int idx = gid.toLowerCase().indexOf("week");
                String sub = gid.substring(idx + 4).trim();
                StringBuilder sb = new StringBuilder();
                for (char c : sub.toCharArray()) { if (Character.isDigit(c)) sb.append(c); else if (sb.length() > 0) break; }
                return sb.length() > 0 ? Integer.parseInt(sb.toString()) : 1;
            } catch (Exception e) {}
        }
        return 1;
    }

    public void importarEstadisticasDeLeaguepedia() {
        List<Partido> pendientes = partidoRepository.findByEstadisticasImportadasFalse();
        if (pendientes.isEmpty()) return;
        
        RestTemplate rt = new RestTemplate();
        ObjectMapper m = new ObjectMapper(); m.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        for (Partido p : pendientes) {
            try {
                String url = "https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=ScoreboardGames=SG,ScoreboardPlayers=SP&fields=SP.GameId,SP.Link,SP.Kills,SP.Deaths,SP.Assists,SP.CS,SP.Gold&join_on=SG.GameId=SP.GameId&where=SG.GameId='" + p.getGameId() + "'&limit=500";
                HttpHeaders h = new HttpHeaders(); h.set("User-Agent", "Mozilla/5.0"); h.set(HttpHeaders.COOKIE, MIS_COOKIES);
                ResponseEntity<String> res = rt.exchange(url, HttpMethod.GET, new HttpEntity<>(h), String.class);
                MatchDataResponse r = m.readValue(res.getBody(), MatchDataResponse.class);
                
                if (r.getCargoquery() != null && !r.getCargoquery().isEmpty()) {
                    transactionTemplate.execute(status -> {
                        for (MatchDataResponse.CargoItem i : r.getCargoquery()) {
                            MatchDataResponse.MatchStats s = i.getTitle();
                            String nick = s.getNickname().split(" \\(")[0].trim();
                            jugadorRepository.findByNickname(nick).ifPresent(jug -> {
                                if (!estadisticaPartidoRepository.existsByPartidoGameIdAndJugadorId(p.getGameId(), jug.getId())) {
                                    EstadisticaPartido ep = new EstadisticaPartido();
                                    ep.setPartido(p); ep.setJugador(jug);
                                    ep.setKills(parsearEnteroSeguro(s.getKills())); 
                                    ep.setDeaths(parsearEnteroSeguro(s.getDeaths()));
                                    ep.setAssists(parsearEnteroSeguro(s.getAssists())); 
                                    ep.setCs(parsearEnteroSeguro(s.getCs()));
                                    ep.setGold(parsearEnteroSeguro(s.getGold()));
                                    ep.setPuntosGenerados(0.0); 
                                    estadisticaPartidoRepository.save(ep);
                                }
                            });
                        }
                        p.setEstadisticasImportadas(true); 
                        partidoRepository.save(p);
                        return true;
                    });
                }
            } catch (Exception e) {}
        }
    }

    private int parsearEnteroSeguro(String v) {
        if (v == null) return 0;
        try { return Integer.parseInt(v.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
    }
}
