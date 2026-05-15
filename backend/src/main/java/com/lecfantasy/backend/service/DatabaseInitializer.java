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

        // Se configura el reloj virtual: Miércoles 14 de Enero 2026
        if (!clockService.isModoDemoActivo()) {
            LocalDateTime inicioDemo = LocalDateTime.of(2026, 1, 14, 10, 0);
            clockService.activarModoDemo(inicioDemo);
            System.out.println("[DEMO] Reloj virtual establecido en: " + inicioDemo);
        }

        // Se crean usuarios de demo
        String pass = passwordEncoder.encode("admin123");
        jdbcTemplate.execute(
                "INSERT IGNORE INTO usuarios (id, email, password, nombre, nickname, created_at, updated_at) VALUES " +
                        "(100, 'profe1@universidad.edu', '" + pass + "', 'Profesor Alfa', 'ProfeAlfa', NOW(), NOW()), "
                        +
                        "(101, 'profe2@universidad.edu', '" + pass + "', 'Profesor Beta', 'ProfeBeta', NOW(), NOW())");

        // Se crea liga de demo
        jdbcTemplate.execute(
                "INSERT IGNORE INTO ligas (id, nombre, codigo_acceso, admin_id, created_at, updated_at) VALUES " +
                        "(100, 'Liga de Evaluación TFG', 'DEMO2026', 100, NOW(), NOW())");

        // Se crean equipos (Presupuesto 40k según FASE 1)
        jdbcTemplate.execute(
                "INSERT IGNORE INTO equipos_usuarios (id, nombre_equipo, presupuesto_disponible, puntuacion_total, liga_id, usuario_id, created_at, updated_at) VALUES "
                        +
                        "(100, 'Team Profe Alfa', 40000.0, 0, 100, 100, NOW(), NOW()), " +
                        "(101, 'Team Profe Beta', 40000.0, 0, 100, 101, NOW(), NOW())");

        System.out.println("[DEMO] Escenario básico listo.");
    }
}
