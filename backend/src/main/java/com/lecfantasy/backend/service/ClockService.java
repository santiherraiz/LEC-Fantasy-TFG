package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.ConfiguracionDemo;
import com.lecfantasy.backend.repository.ConfiguracionDemoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class ClockService {

    @Autowired
    private ConfiguracionDemoRepository configRepo;

    public LocalDateTime ahora() {
        return configRepo.findById(1L)
                .filter(ConfiguracionDemo::isModoDemoActivo)
                .map(config -> {
                    if (config.getUltimaActualizacionReal() == null) {
                        config.setUltimaActualizacionReal(LocalDateTime.now());
                        configRepo.save(config);
                        return config.getFechaSimulada();
                    }
                    long secondsPassed = java.time.Duration.between(
                            config.getUltimaActualizacionReal(), 
                            LocalDateTime.now()
                    ).getSeconds();
                    return config.getFechaSimulada().plusSeconds(secondsPassed);
                })
                .orElseGet(LocalDateTime::now);
    }

    public boolean isModoDemoActivo() {
        return configRepo.findById(1L)
                .map(ConfiguracionDemo::isModoDemoActivo)
                .orElse(false);
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
