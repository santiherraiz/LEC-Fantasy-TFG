package com.lecfantasy.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 [INIT] Comprobando integridad de la base de datos...");

        // Inicializar precioActual si es null
        jdbcTemplate.execute("UPDATE jugadores SET precio_actual = precio_base WHERE precio_actual IS NULL");
        jdbcTemplate.execute("UPDATE jugadores SET compras_hoy = 0 WHERE compras_hoy IS NULL");
        jdbcTemplate.execute("UPDATE jugadores SET ventas_hoy = 0 WHERE ventas_hoy IS NULL");
        System.out.println("✅ [INIT] Precios dinámicos y contadores inicializados.");
    }
}
