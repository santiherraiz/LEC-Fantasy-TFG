package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.ConfiguracionDemo;
import com.lecfantasy.backend.repository.ConfiguracionDemoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Arrays;

@Service
public class ClockService {

    @Autowired
    private ConfiguracionDemoRepository configRepo;

    @Autowired
    private Environment env;

    // Fecha de inicio de la temporada LEC 2026 simulada
    private static final LocalDateTime FECHA_DEMO_INICIO = LocalDateTime.of(2026, 1, 12, 10, 0);

    public LocalDateTime ahora() {
        if (isPerfilDemoActivo()) {
            // Si estamos en modo demo por perfil, calculamos el tiempo relativo desde la última actualización
            return configRepo.findById(1L)
                    .map(config -> {
                        if (config.getFechaSimulada() == null) {
                            config.setFechaSimulada(FECHA_DEMO_INICIO);
                            config.setUltimaActualizacionReal(LocalDateTime.now());
                            configRepo.save(config);
                            return FECHA_DEMO_INICIO;
                        }
                        
                        long secondsPassed = java.time.Duration.between(
                                config.getUltimaActualizacionReal(), 
                                LocalDateTime.now()
                        ).getSeconds();
                        
                        return config.getFechaSimulada().plusSeconds(secondsPassed);
                    })
                    .orElseGet(() -> {
                        // Si no hay configuración en DB, la creamos
                        ConfiguracionDemo config = new ConfiguracionDemo();
                        config.setId(1L);
                        config.setModoDemoActivo(true);
                        config.setFechaSimulada(FECHA_DEMO_INICIO);
                        config.setUltimaActualizacionReal(LocalDateTime.now());
                        configRepo.save(config);
                        return FECHA_DEMO_INICIO;
                    });
        }
        
        // En cualquier otro perfil, hora real
        return LocalDateTime.now();
    }

    public boolean isModoDemoActivo() {
        return isPerfilDemoActivo();
    }

    private boolean isPerfilDemoActivo() {
        return Arrays.asList(env.getActiveProfiles()).contains("demo");
    }

    public void activarModoDemo(LocalDateTime fechaInicial) {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setModoDemoActivo(true);
        config.setFechaSimulada(fechaInicial);
        config.setUltimaActualizacionReal(LocalDateTime.now());
        configRepo.save(config);
    }

    public void desactivarModoDemo() {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setModoDemoActivo(false);
        configRepo.save(config);
    }

    public void establecerFechaSimulada(LocalDateTime nuevaFecha) {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setFechaSimulada(nuevaFecha);
        config.setUltimaActualizacionReal(LocalDateTime.now());
        configRepo.save(config);
    }
}
