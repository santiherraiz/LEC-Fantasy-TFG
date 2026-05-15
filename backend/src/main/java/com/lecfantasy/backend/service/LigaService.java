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
import java.util.Arrays;
import java.util.Random;
import java.util.Collections;
import java.util.stream.Collectors;

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

        if (equipoRepository.findByUsuarioIdAndLigaId(usuarioId, liga.getId()).isPresent()) {
            throw new RuntimeException("Ya eres parte de esta liga");
        }

        crearEquipoEnLiga(usuario, liga);

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
        equipo.setPresupuestoDisponible(40000.0);
        equipo.setPuntuacionTotal(0.0);
        equipo.setUsuario(usuario);
        equipo.setLiga(liga);
        Equipo equipoGuardado = equipoRepository.save(equipo);

        generarPlantillaInicial(equipoGuardado);
    }

    private void generarPlantillaInicial(Equipo equipo) {
        log.info("Generando plantilla inicial (Composición: 1 S, 2 A/B, 2 C) para el equipo {}...", equipo.getId());
        List<String> rolesDisponibles = new ArrayList<>(Arrays.asList("TOP", "JUNGLE", "MID", "BOT", "SUPPORT"));
        Collections.shuffle(rolesDisponibles);

        // Definimos el reparto de Tiers por roles (aleatorio cada vez)
        // rolesDisponibles[0]: Tier S (35k)
        // rolesDisponibles[1-2]: Tier A/B (15k)
        // rolesDisponibles[3-4]: Tier C (5k)
        List<Jugador> seleccionFinal = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < rolesDisponibles.size(); i++) {
            String rol = rolesDisponibles.get(i);
            double precioMin, precioMax;

            if (i == 0) { // 1 jugador Tier S
                precioMin = 30000.0;
                precioMax = 40000.0;
            } else if (i == 1 || i == 2) { // 2 jugadores Tier A/B
                precioMin = 10000.0;
                precioMax = 20000.0;
            } else { // 2 jugadores Tier C
                precioMin = 0.0;
                precioMax = 9000.0;
            }

            List<Jugador> candidatos = jugadorRepository.findJugadoresLibresPorRolYLiga(rol, equipo.getLiga().getId())
                    .stream()
                    .filter(j -> {
                        double precio = (j.getPrecioActual() != null ? j.getPrecioActual() : j.getPrecioBase());
                        return precio >= precioMin && precio <= precioMax;
                    })
                    .collect(Collectors.toList());

            if (candidatos.isEmpty()) {
                log.warn(
                        "No hay jugadores de Tier específico para el rol {} en el rango {}-{}. Usando cualquier libre.",
                        rol, precioMin, precioMax);
                candidatos = jugadorRepository.findJugadoresLibresPorRolYLiga(rol, equipo.getLiga().getId());
            }

            if (!candidatos.isEmpty()) {
                Jugador elegido = candidatos.get(random.nextInt(candidatos.size()));
                seleccionFinal.add(elegido);
            }
        }

        if (seleccionFinal.isEmpty()) {
            log.error("No se pudo generar una selección final de 5 jugadores para el equipo {}", equipo.getId());
        }

        for (Jugador j : seleccionFinal) {
            Plantilla p = new Plantilla();
            p.setEquipo(equipo);
            p.setJugador(j);
            p.setEstado(EstadoAlineacion.TITULAR);
            plantillaRepository.save(p);
            log.debug("Asignado jugador {} ({}) al equipo {}", j.getNickname(), j.getRol(), equipo.getId());
        }
    }

    @Transactional(readOnly = true)
    public List<Liga> obtenerLigasDeUsuario(Long usuarioId) {
        return ligaRepository.findLigasByUsuarioId(usuarioId);
    }
}
