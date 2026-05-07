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

    public boolean isModoDemoActivo() {
        return configRepo.findById(1L)
                .map(ConfiguracionDemo::isModoDemoActivo)
                .orElse(false);
    }

    public void activarModoDemo(LocalDateTime fechaInicial, java.util.Map<Long, Double> presupuestos) {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        config.setModoDemoActivo(true);
        config.setFechaSimulada(fechaInicial);
        config.setBackupPresupuestos(new java.util.HashMap<>(presupuestos));
        configRepo.save(config);
    }

    public java.util.Map<Long, Double> desactivarModoDemo() {
        ConfiguracionDemo config = configRepo.findById(1L).orElse(new ConfiguracionDemo());
        java.util.Map<Long, Double> backup = new java.util.HashMap<>(config.getBackupPresupuestos());
        config.setModoDemoActivo(false);
        config.getBackupPresupuestos().clear();
        configRepo.save(config);
        return backup;
    }

    public void establecerFechaSimulada(LocalDateTime nuevaFecha) {
        configRepo.findById(1L).ifPresent(config -> {
            config.setFechaSimulada(nuevaFecha);
            configRepo.save(config);
        });
    }
}
