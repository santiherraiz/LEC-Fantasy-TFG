package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class LigaService {

    private static final Logger log = LoggerFactory.getLogger(LigaService.class);

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private NoticiaService noticiaService;

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private PlantillaRepository plantillaRepository;

    @Autowired
    private MercadoService mercadoService;

    @Transactional
    public Liga crearLiga(String nombre, Long adminId) {
        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Liga liga = new Liga();
        liga.setNombre(nombre);
        liga.setAdministrador(admin);
        Liga ligaGuardada = ligaRepository.save(liga);

        // Crear equipo para el admin en su propia liga
        crearEquipoEnLiga(admin, ligaGuardada);

        // Inicializar el mercado para la nueva liga inmediatamente
        mercadoService.initMercadoParaLiga(ligaGuardada);

        // Noticia de bienvenida
        noticiaService.crearNoticia(
                ligaGuardada.getId(),
                TipoNoticia.NUEVA_LIGA,
                "¡Bienvenidos a la liga " + nombre + "! Que gane el mejor manager.",
                null, null, null);

        return ligaGuardada;
    }

    @Transactional
    public Liga unirseALiga(String codigo, Long usuarioId) {
        Liga liga = ligaRepository.findByCodigoAcceso(codigo)
                .orElseThrow(() -> new RuntimeException("Código de liga inválido"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar si ya tiene equipo en esta liga
        if (equipoRepository.findByUsuarioIdAndLigaId(usuarioId, liga.getId()).isPresent()) {
            throw new RuntimeException("Ya eres parte de esta liga");
        }

        crearEquipoEnLiga(usuario, liga);

        // Noticia de nuevo usuario
        noticiaService.crearNoticia(
                liga.getId(),
                TipoNoticia.NUEVA_LIGA,
                "¡" + usuario.getNickname() + " se ha unido a la liga!",
                null, null, null);

        return liga;
    }

    private void crearEquipoEnLiga(Usuario usuario, Liga liga) {
        Equipo equipo = new Equipo();
        equipo.setNombreEquipo("Equipo de " + usuario.getNickname());
        equipo.setPresupuestoDisponible(50000.0);
        equipo.setPuntuacionTotal(0.0);
        equipo.setUsuario(usuario);
        equipo.setLiga(liga);
        Equipo equipoGuardado = equipoRepository.save(equipo);

        generarPlantillaInicial(equipoGuardado);
    }

    private void generarPlantillaInicial(Equipo equipo) {
        log.info("Generando plantilla inicial para el equipo {} de la liga {}", equipo.getId(),
                equipo.getLiga().getId());
        String[] roles = { "TOP", "JUNGLE", "MID", "BOT", "SUPPORT" };
        double targetValue = 25000.0;
        double variance = 4000.0;
        int maxAttempts = 50;

        Random random = new Random();
        List<Jugador> seleccionFinal = new ArrayList<>();

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            List<Jugador> seleccionIntento = new ArrayList<>();
            double currentTotal = 0;

            for (String rol : roles) {
                final List<Jugador> seleccionadosYa = new ArrayList<>(seleccionIntento);
                List<Jugador> disponibles = jugadorRepository.findJugadoresLibresPorRolYLiga(rol,
                        equipo.getLiga().getId())
                        .stream()
                        .filter(j -> seleccionadosYa.stream().noneMatch(s -> s.getId().equals(j.getId())))
                        .toList();

                if (disponibles.isEmpty()) {
                    log.warn("No hay jugadores libres para el rol {} en la liga {}. Usando pool general de libres.", rol,
                            equipo.getLiga().getId());
                    // Fallback: Cualquier jugador de ese rol que no esté en uso en ESTA liga
                    disponibles = jugadorRepository.findJugadoresLibresPorRolYLiga(rol, equipo.getLiga().getId())
                            .stream()
                            .filter(j -> seleccionadosYa.stream().noneMatch(s -> s.getId().equals(j.getId())))
                            .toList();
                }

                if (!disponibles.isEmpty()) {
                    Jugador elegido = disponibles.get(random.nextInt(disponibles.size()));
                    seleccionIntento.add(elegido);
                    currentTotal += (elegido.getPrecioActual() != null ? elegido.getPrecioActual()
                            : elegido.getPrecioBase());
                } else {
                    log.error(
                            "¡ERROR CRÍTICO! No se encontraron jugadores libres para el rol {} en la liga {}.",
                            rol, equipo.getLiga().getId());
                }
            }

            if (seleccionIntento.size() == 5) {
                if (Math.abs(currentTotal - targetValue) <= variance) {
                    log.info("Selección de equipo aceptada en el intento {} con valor total: {}", attempt,
                            currentTotal);
                    seleccionFinal = seleccionIntento;
                    break;
                }
                if (attempt == maxAttempts - 1) {
                    log.warn("Se alcanzó el máximo de intentos. Usando última selección con valor: {}", currentTotal);
                    seleccionFinal = seleccionIntento;
                }
            }
        }

        if (seleccionFinal.isEmpty()) {
            log.error("No se pudo generar una selección final de 5 jugadores para el equipo {}", equipo.getId());
        }

        // Guardar la plantilla
        for (Jugador j : seleccionFinal) {
            Plantilla p = new Plantilla();
            p.setEquipo(equipo);
            p.setJugador(j);
            p.setEstado(EstadoAlineacion.TITULAR);
            plantillaRepository.save(p);
            log.debug("Asignado jugador {} ({}) al equipo {}", j.getNickname(), j.getRol(), equipo.getId());
        }
    }

    public List<Liga> obtenerLigasDeUsuario(Long usuarioId) {
        return ligaRepository.findLigasByUsuarioId(usuarioId);
    }
}
