package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.MatchScheduleResponse;
import com.lecfantasy.backend.entity.Jornada;
import com.lecfantasy.backend.entity.JornadaEstado;
import com.lecfantasy.backend.repository.JornadaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class JornadaService {

    @Autowired
    private JornadaRepository jornadaRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private final String MIS_COOKIES = "exp_bucket=v8-30; exp_bucket_2=v5-71; Geo=OK; addtl_consent=1~; euconsent-v2=CPt3fQAPt3fQACNAFAENDLCgAAAAAAAAACiQAAAOCgDAB-AIsAZ8A6QDBAHBAAAA.YAAAAAAAAAAA; tracking-opt-in-status=rejected; eb=21; wikia_beacon_id=UoF5QNPsWU; _b2=33lVvLjkgb.1772207254112; wikia_session_id=YoPddHOEPf; tech-update-disable-banner-global=1; Geo={%22region%22:%22VC%22%2C%22city%22:%22valencia%22%2C%22country_name%22:%22spain%22%2C%22country%22:%22ES%22%2C%22continent%22:%22EU%22}; csrf_token_7edb4307044064c5213d44940aa94f48ab88fe0b5ead052fbb75851a981aa6c4=WUhtlDDhR4uxQnsEXOMPBm7g1FOj9RECs3OMmRh2kHM=; fandom_session=MTc3MjIwODAxMXxGSl9JQUx1YWxNZmtsWU50NjhTbHZGWEN0d3JwbEprblhBUzVSTUNxNmVsYjE1TThxRlFBMkx6VUlOVGNvMnpvTldjSGtkSG1kTHJvVWRkcEhZOFIzZ0t5SjlHMTBYZGxjWVQxRDc4Y045ZEpwVmc1Ri1NYXNHRVk4dlMwVVN6NkdscVA4ckJaRGppc1dtTjJrN1ZSUFZ2R1NUMHcwNEtNQjZjeTM3OEZScUhWWlhYZWI0M21aRzJQYUo3S0hxMW9oWU5BVDlzMHhNcVdaUmpyR3l0OV9kQkFLWG93cEROQTZuQ1RJTVk0ZW5pRkxIRENRTkctSkU2T21OUkl5bVVfb1dmTHBpazFackdEd2YtQTJjc1Z8CDwpld0LGuQXDiEgSulsFHKfgSqQk0eDnLbQDnVty5g=; cf_clearance=RZYlgTyXRq4z9_tvnuR6SSVBnyeCvmeVztHKYgZyKyM-1772210450-1.2.1.1-053OqMFwETU1SPNpCGKpUgTisLoPPm3wY5gmZ_3ASpsilx7Itu5d1n54Jgo.a4.yxcP2oWbk1beah5jwJaYynCpPB0orsPqx5Bl_rtNIAiNwiXWZw3H_WWZTK.5IGbX9FlvFBYjyWPlPa.dGdU3cAW2ns0la04lt.9aIo6hfeDhZ1T_oHNVfVyJsb5I8GPc2wFGLPN.DgK29QpWX5grOa5VSaHqYQgV3KCnRnKMU9bA; __cf_bm=cciPxjAC.b5vokkRLHBYlpD6CDGvxrJuMVQcmDako1s-1772217511-1.0.1.1-eN9AopuYZDmd.BQdurja5xDDRPMO0lNgeY0cV1mMF4u4ctqG2vpQAy3SBUn7Jrdj5KVeT6VCicJey8LzTm4BkqZFwBXXvRJtj3M9YRByQ90; leftPanelOpen=0";

    public void sincronizarCalendario() {
        System.out.println("🔍 [JORNADA] Sincronizando calendario 2026 desde MatchSchedule (ESTÁ COMPROBADO)...");
        
        // Filtro verificado: OverviewPage es el campo estable para 2026 en MatchSchedule
        String url = UriComponentsBuilder.fromUriString("https://lol.fandom.com/api.php")
                .queryParam("action", "cargoquery")
                .queryParam("format", "json")
                .queryParam("tables", "MatchSchedule")
                .queryParam("fields", "Team1,Team2,DateTime_UTC,MatchId")
                .queryParam("where", "OverviewPage = 'LEC/2026 Season/Spring Season'")
                .queryParam("limit", "500")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
        headers.set(HttpHeaders.COOKIE, MIS_COOKIES);

        try {
            ResponseEntity<MatchScheduleResponse> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), MatchScheduleResponse.class);
            
            if (response.getBody() == null || response.getBody().getCargoquery() == null || response.getBody().getCargoquery().isEmpty()) {
                System.out.println("❌ [JORNADA] No se encontraron partidos en MatchSchedule para 2026.");
                return;
            }

            procesarRespuestaCargo(response.getBody());
            
        } catch (Exception e) {
            System.err.println("❌ [JORNADA] Error crítico: " + e.getMessage());
        }
    }

    private void procesarRespuestaCargo(MatchScheduleResponse response) {
        System.out.println("✅ [JORNADA] Partidos encontrados: " + response.getCargoquery().size());
        Map<Integer, List<LocalDateTime>> partidosPorSemana = new HashMap<>();

        for (MatchScheduleResponse.CargoItem item : response.getCargoquery()) {
            MatchScheduleResponse.MatchScheduleData data = item.getTitle();
            if (data.getDateTimeUtc() == null || data.getMatchId() == null) continue;

            int semana = extraerSemana(data.getMatchId());
            LocalDateTime fecha = LocalDateTime.parse(data.getDateTimeUtc().replace(" ", "T"));
            partidosPorSemana.computeIfAbsent(semana, k -> new ArrayList<>()).add(fecha);
        }

        for (Map.Entry<Integer, List<LocalDateTime>> entry : partidosPorSemana.entrySet()) {
            int numSemana = entry.getKey();
            List<LocalDateTime> fechas = entry.getValue();
            LocalDateTime minFecha = Collections.min(fechas);
            LocalDateTime maxFecha = Collections.max(fechas).plusHours(4); // Margen fin serie

            Optional<Jornada> jornadaOpt = jornadaRepository.findByNumeroSemana(numSemana);
            Jornada jornada = jornadaOpt.orElse(new Jornada());
            
            if (jornadaOpt.isEmpty()) {
                jornada.setNumeroSemana(numSemana);
                jornada.setEstado(JornadaEstado.PROGRAMADA);
            }
            
            if (jornada.getEstado() != JornadaEstado.FINALIZADA) {
                jornada.setFechaInicio(minFecha);
                jornada.setFechaFin(maxFecha);
                jornadaRepository.save(jornada);
                System.out.println("💾 [JORNADA] Semana " + numSemana + " guardada (" + minFecha + " a " + maxFecha + ")");
            }
        }
        System.out.println("🏁 [JORNADA] Sincronización 2026 completada con éxito.");
    }

    public Optional<Jornada> obtenerJornadaSiguiente() {
        return jornadaRepository.findAll().stream()
                .filter(j -> j.getEstado() == JornadaEstado.PROGRAMADA)
                .min(Comparator.comparing(Jornada::getFechaInicio));
    }

    private int extraerSemana(String mid) {
        if (mid == null) return 1;
        String lower = mid.toLowerCase();
        if (lower.contains("week")) {
            try {
                int idx = lower.indexOf("week");
                String sub = lower.substring(idx + 4).trim();
                StringBuilder sb = new StringBuilder();
                for (char c : sub.toCharArray()) {
                    if (Character.isDigit(c)) sb.append(c);
                    else if (sb.length() > 0) break;
                }
                return sb.length() > 0 ? Integer.parseInt(sb.toString()) : 1;
            } catch (Exception e) { return 1; }
        }
        return 1;
    }
}
