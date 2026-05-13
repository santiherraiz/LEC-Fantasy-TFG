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

        // FASE 1: Reset de precios si detectamos valores antiguos o nulos
        jdbcTemplate.execute(
                "UPDATE jugadores SET precio_base = 35000 WHERE (nickname LIKE 'Caps%' OR nickname LIKE 'BrokenBlade%' OR nickname LIKE 'Razork%' OR nickname LIKE 'Humanoid%' OR nickname LIKE 'Photon%') AND precio_base < 35000");
        jdbcTemplate.execute(
                "UPDATE jugadores SET precio_base = 15000 WHERE precio_base = 5000 AND nickname NOT LIKE 'Caps%' AND (nickname LIKE 'Elyoya%' OR nickname LIKE 'Supak%' OR nickname LIKE 'Caliste%')");

        jdbcTemplate.execute(
                "UPDATE jugadores SET precio_actual = precio_base WHERE precio_actual IS NULL OR precio_actual = 0");
        jdbcTemplate.execute("UPDATE jugadores SET compras_hoy = 0 WHERE compras_hoy IS NULL");
        jdbcTemplate.execute("UPDATE jugadores SET ventas_hoy = 0 WHERE ventas_hoy IS NULL");

        if (Arrays.asList(env.getActiveProfiles()).contains("demo")) {
            prepararEscenarioDemo();
        }

        System.out.println("[INIT] Precios dinámicos y contadores inicializados.");
    }

    private void prepararEscenarioDemo() {
        System.out.println("[DEMO] Preparando escenario de demostración...");

        // 1. Configurar Reloj Virtual: Miércoles 14 de Enero 2026
        if (!clockService.isModoDemoActivo()) {
            LocalDateTime inicioDemo = LocalDateTime.of(2026, 1, 14, 10, 0);
            clockService.activarModoDemo(inicioDemo);
            System.out.println("[DEMO] Reloj virtual establecido en: " + inicioDemo);
        }

        // 2. Crear Usuarios de Demo
        String pass = passwordEncoder.encode("admin123");
        jdbcTemplate.execute(
                "INSERT IGNORE INTO usuarios (id, email, password, nombre, nickname, created_at, updated_at) VALUES " +
                        "(100, 'profe1@universidad.edu', '" + pass + "', 'Profesor Alfa', 'ProfeAlfa', NOW(), NOW()), "
                        +
                        "(101, 'profe2@universidad.edu', '" + pass + "', 'Profesor Beta', 'ProfeBeta', NOW(), NOW())");

        // 3. Crear Liga de Demo
        jdbcTemplate.execute(
                "INSERT IGNORE INTO ligas (id, nombre, codigo_acceso, admin_id, created_at, updated_at) VALUES " +
                        "(100, 'Liga de Evaluación TFG', 'DEMO2026', 100, NOW(), NOW())");

        // 4. Crear Equipos (Presupuesto 40k según FASE 1)
        jdbcTemplate.execute(
                "INSERT IGNORE INTO equipos_usuarios (id, nombre_equipo, presupuesto_disponible, puntuacion_total, liga_id, usuario_id, created_at, updated_at) VALUES "
                        +
                        "(100, 'Team Profe Alfa', 40000.0, 0, 100, 100, NOW(), NOW()), " +
                        "(101, 'Team Profe Beta', 40000.0, 0, 100, 101, NOW(), NOW())");

        System.out.println("[DEMO] Escenario básico listo.");
    }
}
