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
                .map(ConfiguracionDemo::getFechaSimulada)
                .orElseGet(LocalDateTime::now);
    }

    public void activarModoDemo(LocalDateTime fechaInicial) {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setModoDemoActivo(true);
        config.setFechaSimulada(fechaInicial);
        configRepo.save(config);
    }

    public void desactivarModoDemo() {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setModoDemoActivo(false);
        configRepo.save(config);
    }

    public void establecerFechaSimulada(LocalDateTime nuevaFecha) {
        configRepo.findById(1L).ifPresent(config -> {
            config.setFechaSimulada(nuevaFecha);
            configRepo.save(config);
        });
    }
}
