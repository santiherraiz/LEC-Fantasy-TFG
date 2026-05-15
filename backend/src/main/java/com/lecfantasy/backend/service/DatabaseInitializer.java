package com.lecfantasy.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.env.Environment;
import java.util.Arrays;
import java.time.LocalDateTime;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment env;

    @Autowired
    private ClockService clockService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JugadorService jugadorService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("[INIT] Comprobando integridad de la base de datos...");

        if (Arrays.asList(env.getActiveProfiles()).contains("demo")) {
            prepararEscenarioDemo();
        }

        System.out.println("[INIT] Inicialización completada.");
    }

    private void prepararEscenarioDemo() {
        System.out.println("[DEMO] Preparando escenario de demostración...");

        // Se configura el reloj virtual: 24 de Marzo 2026 (aprox 4 días antes de la Jornada 1)
        // Usamos establecerFechaSimulada para forzar el cambio incluso si ya estaba inicializado
        LocalDateTime inicioDemo = LocalDateTime.of(2026, 3, 24, 10, 0);
        clockService.establecerFechaSimulada(inicioDemo);
        System.out.println("[DEMO] Reloj virtual establecido/forzado en: " + inicioDemo);

        // Forzar actualización de imágenes para que se vean logos y fotos correctas
        try {
            System.out.println("[DEMO] Aplicando parche de imágenes y logos...");
            jugadorService.forzarActualizacionImagenes();
        } catch (Exception e) {
            System.err.println("[DEMO] Error aplicando imágenes: " + e.getMessage());
        }

        System.out.println("[DEMO] Escenario de tiempo configurado y fotos actualizadas.");
    }
}
