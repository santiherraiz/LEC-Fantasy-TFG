package com.lecfantasy.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Collectors;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 [INIT] Comprobando integridad de imágenes...");
        
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM jugadores WHERE imagen_url IS NOT NULL", Integer.class);

        if (count == null || count == 0) {
            System.out.println("📸 [INIT] No se detectaron imágenes. Aplicando script de auto-actualización...");
            try {
                // Leemos el script SQL (buscamos en la raíz del proyecto)
                String sql = Files.lines(Paths.get("../scratch/update_images_2026.sql"))
                                  .filter(line -> !line.startsWith("--") && !line.trim().isEmpty())
                                  .collect(Collectors.joining("\n"));
                
                // Dividimos por punto y coma para ejecutar cada comando
                for (String statement : sql.split(";")) {
                    if (!statement.trim().isEmpty()) {
                        jdbcTemplate.execute(statement);
                    }
                }
                System.out.println("✅ [INIT] Imágenes y logos de equipos actualizados correctamente.");
            } catch (Exception e) {
                System.err.println("❌ [INIT] Error al aplicar el script de imágenes: " + e.getMessage());
            }
        } else {
            System.out.println("✅ [INIT] Las imágenes ya están presentes en la base de datos.");
        }
    }
}
