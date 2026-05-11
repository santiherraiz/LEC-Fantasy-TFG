package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.*;
import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class MercadoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoService.class);

    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private PlantillaRepository plantillaRepository;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SubastaRepository subastaRepository;
    @Autowired
    private PujaRepository pujaRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private LigaRepository ligaRepository;
    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;
    @Autowired
    private ClockService clockService;

    @Autowired
    private NoticiaService noticiaService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private MercadoService self;

    public List<SubastaDTO> obtenerSubastasActivas(Long ligaId, Long usuarioId) {
        List<Subasta> subastas = subastaRepository.findByLigaIdAndFinalizadaFalse(ligaId);

        return subastas.stream().map(s -> {
            SubastaDTO dto = new SubastaDTO();
            dto.setId(s.getId());
            dto.setJugador(s.getJugador());
            dto.setFechaFin(s.getFechaFin());

            Optional<Puja> miPuja = pujaRepository.findBySubastaIdAndUsuarioId(s.getId(), usuarioId);
            miPuja.ifPresent(puja -> dto.setMiPuja(puja.getCantidad()));

            return dto;
        }).collect(Collectors.toList());
    }

    public List<CatalogoJugadorDTO> obtenerCatalogo(Long ligaId) {
        List<Jugador> todos = jugadorRepository.findAll();
        List<Plantilla> ocupados = plantillaRepository.findByEquipoLigaId(ligaId);
        
        // Traemos todas las estadísticas para calcular puntos y media
        List<EstadisticaPartido> todasLasStats = estadisticaPartidoRepository.findAll();
        java.util.Map<Long, List<EstadisticaPartido>> statsPorJugador = todasLasStats.stream()
                .collect(Collectors.groupingBy(s -> s.getJugador().getId()));

        java.util.Map<Long, String> propietarios = ocupados.stream()
                .collect(Collectors.toMap(
                        p -> p.getJugador().getId(),
                        p -> p.getEquipo().getUsuario().getNickname(),
                        (v1, v2) -> v1));

        return todos.stream().map(j -> {
            CatalogoJugadorDTO dto = new CatalogoJugadorDTO();
            dto.setJugador(j);
            dto.setPropietarioNickname(propietarios.get(j.getId()));

            List<EstadisticaPartido> stats = statsPorJugador.getOrDefault(j.getId(), Collections.emptyList());
            double total = stats.stream().mapToDouble(EstadisticaPartido::getPuntosGenerados).sum();
            
            long numSeries = stats.stream()
                    .map(s -> s.getPartido().getSerieId())
                    .distinct()
                    .count();
            
            double media = numSeries == 0 ? 0.0 : total / numSeries;
            
            dto.setPuntosTotales(total);
            dto.setPuntosMedia(Math.round(media * 10.0) / 10.0);
            
            System.out.println("DEBUG: Jugador " + j.getNickname() + " - Puntos: " + total);

            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public String pujar(PujaRequest request) {
        Subasta subasta = subastaRepository.findById(request.getSubastaId())
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.isFinalizada() || subasta.getFechaFin().isBefore(clockService.ahora())) {
            throw new RuntimeException("La subasta ya ha finalizado");
        }

        if (request.getCantidad() < subasta.getJugador().getPrecioActual()) {
            throw new RuntimeException("La puja mínima es de " + subasta.getJugador().getPrecioActual());
        }

        Equipo equipo = equipoRepository.findByUsuarioIdAndLigaId(request.getUsuarioId(), subasta.getLiga().getId())
                .orElseThrow(() -> new RuntimeException("El usuario no tiene equipo en esta liga"));

        // Comprobamos si ya tiene una puja para actualizarla o crear una nueva
        Optional<Puja> pujaExistente = pujaRepository.findBySubastaIdAndUsuarioId(subasta.getId(),
                request.getUsuarioId());

        double diferencia = request.getCantidad();
        if (pujaExistente.isPresent()) {
            diferencia = request.getCantidad() - pujaExistente.get().getCantidad();
        }

        if (equipo.getPresupuestoDisponible() < diferencia) {
            throw new RuntimeException("Presupuesto insuficiente");
        }

        // Bloqueamos el dinero (lo restamos del presupuesto)
        equipo.setPresupuestoDisponible(equipo.getPresupuestoDisponible() - diferencia);
        equipoRepository.save(equipo);

        if (pujaExistente.isPresent()) {
            Puja puja = pujaExistente.get();
            puja.setCantidad(request.getCantidad());
            puja.setFechaPuja(clockService.ahora());
            pujaRepository.save(puja);
        } else {
            Puja nuevaPuja = new Puja();
            nuevaPuja.setSubasta(subasta);
            nuevaPuja.setUsuario(usuarioRepository.findById(request.getUsuarioId()).get());
            nuevaPuja.setCantidad(request.getCantidad());
            nuevaPuja.setFechaPuja(clockService.ahora());
            pujaRepository.save(nuevaPuja);
        }

        return "Puja realizada con éxito";
    }

    @Transactional
    public String eliminarPuja(Long subastaId, Long usuarioId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.isFinalizada() || subasta.getFechaFin().isBefore(clockService.ahora())) {
            throw new RuntimeException("La subasta ya ha finalizado, no puedes retirar la puja");
        }

        Puja puja = pujaRepository.findBySubastaIdAndUsuarioId(subastaId, usuarioId)
                .orElseThrow(() -> new RuntimeException("No tienes ninguna puja en esta subasta"));

        Equipo equipo = equipoRepository.findByUsuarioIdAndLigaId(usuarioId, subasta.getLiga().getId())
                .orElseThrow(() -> new RuntimeException("El usuario no tiene equipo en esta liga"));

        // Devolvemos el dinero al presupuesto
        equipo.setPresupuestoDisponible(equipo.getPresupuestoDisponible() + puja.getCantidad());
        equipoRepository.save(equipo);

        // Borramos la puja
        pujaRepository.delete(puja);

        return "Puja retirada con éxito. Se han devuelto " + puja.getCantidad() + " € a tu presupuesto.";
    }

    @Transactional
    public void generarSubastasConFechaFin(Liga liga, LocalDateTime fechaFin) {
        // 1. Obtener IDs de jugadores ocupados (en equipos o en subastas activas)
        List<Long> ocupadosIds = plantillaRepository.findByEquipoLigaId(liga.getId())
                .stream()
                .map(p -> p.getJugador().getId())
                .collect(Collectors.toList());

        List<Long> enSubastaIds = subastaRepository.findByLigaIdAndFinalizadaFalse(liga.getId())
                .stream()
                .map(s -> s.getJugador().getId())
                .collect(Collectors.toList());

        ocupadosIds.addAll(enSubastaIds);

        // 2. Obtener lista de todos los jugadores disponibles
        List<Jugador> disponibles = jugadorRepository.findAll().stream()
                .filter(j -> !ocupadosIds.contains(j.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        List<Jugador> seleccionados = new ArrayList<>();
        String[] roles = {"TOP", "JUNGLE", "MID", "ADC", "SUPPORT"};
        LocalDateTime ahora = clockService.ahora();

        // 3. Intentar elegir uno de cada rol
        for (String rol : roles) {
            String dbRol = rol.equals("ADC") ? "BOT" : rol;
            List<Jugador> jugadoresDelRol = disponibles.stream()
                    .filter(j -> j.getRol().equalsIgnoreCase(dbRol))
                    .collect(Collectors.toList());
            
            if (!jugadoresDelRol.isEmpty()) {
                Collections.shuffle(jugadoresDelRol);
                Jugador elegido = jugadoresDelRol.get(0);
                
                // Normalizamos el rol a BOT antes de guardar si es un tirador
                if (elegido.getRol().equalsIgnoreCase("Bot")) {
                    elegido.setRol("BOT");
                    jugadorRepository.save(elegido);
                }
                
                seleccionados.add(elegido);
                disponibles.remove(elegido);
            }
        }

        // 4. Si faltan huecos (porque no había jugadores de un rol), rellenar con cualquiera
        if (seleccionados.size() < 5 && !disponibles.isEmpty()) {
            Collections.shuffle(disponibles);
            int faltantes = 5 - seleccionados.size();
            for (int i = 0; i < Math.min(faltantes, disponibles.size()); i++) {
                seleccionados.add(disponibles.get(i));
            }
        }

        // 5. Crear las subastas finales
        for (Jugador j : seleccionados) {
            Subasta s = new Subasta();
            s.setLiga(liga);
            s.setJugador(j);
            s.setFechaInicio(ahora);
            s.setFechaFin(fechaFin);
            subastaRepository.save(s);
        }

        // 6. Notificar a todos los usuarios de la liga
        List<Equipo> equipos = equipoRepository.findAllByLigaIdOrderByPuntuacionTotalDesc(liga.getId());
        for (Equipo e : equipos) {
            notificationService.enviarNotificacion(
                e.getUsuario().getPushToken(),
                "¡Mercado Renovado!",
                "Nuevos jugadores han aparecido en subasta. ¡No pierdas tu oportunidad!"
            );
        }
    }

    public void resolverSubastasExpiradas() {
        log.info("Buscando subastas expiradas para resolver a las {}...", clockService.ahora());
        List<Subasta> expiradas = subastaRepository.findByFinalizadaFalseAndFechaFinBefore(clockService.ahora());
        log.info("Encontradas {} subastas para cerrar.", expiradas.size());

        for (Subasta s : expiradas) {
            try {
                // Usamos 'self' para que la anotación @Transactional(propagation = Propagation.REQUIRES_NEW) funcione
                self.resolverSubastaIndividual(s.getId());
            } catch (Exception e) {
                log.error("Error crítico resolviendo subasta {}: {}", s.getId(), e.getMessage());
            }
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void resolverSubastaIndividual(Long subastaId) {
        Subasta s = subastaRepository.findById(subastaId).orElseThrow();
        log.info("Resolviendo subasta ID: {} - Jugador: {} - Fecha Fin: {}", s.getId(), s.getJugador().getNickname(), s.getFechaFin());
        
        List<Puja> pujas = pujaRepository.findBySubastaIdOrderByCantidadDescFechaPujaAsc(s.getId());

        if (!pujas.isEmpty()) {
            Puja ganadora = pujas.get(0);
            log.info("GANADOR: {} con puja de {}", ganadora.getUsuario().getNickname(), ganadora.getCantidad());

            Equipo equipoGanador = equipoRepository.findByUsuarioIdAndLigaId(ganadora.getUsuario().getId(), s.getLiga().getId())
                .orElseThrow(() -> new RuntimeException("Equipo ganador no encontrado para usuario " + ganadora.getUsuario().getId()));

            // Evitar duplicados si por algún motivo ya lo tiene
            if (!plantillaRepository.existsByEquipoIdAndJugadorId(equipoGanador.getId(), s.getJugador().getId())) {
                Plantilla p = new Plantilla();
                p.setEquipo(equipoGanador);
                p.setJugador(s.getJugador());
                p.setEstado(EstadoAlineacion.BANQUILLO);
                plantillaRepository.save(p);
                log.info("Jugador {} añadido a la plantilla de {}", s.getJugador().getNickname(), equipoGanador.getNombreEquipo());

                // Incrementar comprasHoy
                Jugador j = s.getJugador();
                int actuales = (j.getComprasHoy() != null) ? j.getComprasHoy() : 0;
                j.setComprasHoy(actuales + 1);
                jugadorRepository.save(j);

                // Noticia de subasta ganada
                noticiaService.crearNoticia(
                    s.getLiga().getId(),
                    TipoNoticia.SUBASTA_GANADA,
                    String.format("¡%s ha ganado la subasta por %s por %.0f €!", 
                        ganadora.getUsuario().getNickname(), 
                        s.getJugador().getNickname(), 
                        ganadora.getCantidad()),
                    s.getJugador().getId(),
                    equipoGanador.getId(),
                    s.getJugador().getImagenUrl()
                );
            }

            // Notificar al ganador
            try {
                notificationService.enviarNotificacion(
                    ganadora.getUsuario().getPushToken(),
                    "¡Fichaje completado!",
                    "¡Enhorabuena! Has fichado a " + s.getJugador().getNickname() + " por " + ganadora.getCantidad() + " €."
                );
            } catch (Exception e) {
                log.warn("Error enviando notificación al ganador: {}", e.getMessage());
            }

            // Devolver dinero a los perdedores y notificarles
            for (int i = 1; i < pujas.size(); i++) {
                Puja perdedora = pujas.get(i);
                Optional<Equipo> equipoPerdedorOpt = equipoRepository.findByUsuarioIdAndLigaId(perdedora.getUsuario().getId(), s.getLiga().getId());
                
                if (equipoPerdedorOpt.isPresent()) {
                    Equipo equipoPerdedor = equipoPerdedorOpt.get();
                    equipoPerdedor.setPresupuestoDisponible(equipoPerdedor.getPresupuestoDisponible() + perdedora.getCantidad());
                    equipoRepository.save(equipoPerdedor);
                    log.info("Devueltos {} € a {}", perdedora.getCantidad(), equipoPerdedor.getNombreEquipo());

                    try {
                        notificationService.enviarNotificacion(
                            perdedora.getUsuario().getPushToken(),
                            "Subasta finalizada",
                            "Has perdido la subasta por " + s.getJugador().getNickname() + ". Se han devuelto " + perdedora.getCantidad() + " € a tu presupuesto."
                        );
                    } catch (Exception e) {
                        log.warn("Error enviando notificación al perdedor: {}", e.getMessage());
                    }
                }
            }
        } else {
            log.info("Sin pujas para la subasta del jugador: {}", s.getJugador().getNickname());
        }

        s.setFinalizada(true);
        subastaRepository.save(s);
    }

    public void forzarRefrescoMercado() {
        log.info("FORZANDO refresco manual del mercado...");
        // 1. Resolvemos las que ya deberían haber terminado
        resolverSubastasExpiradas();

        // 2. Para cada liga, si no hay activas, generamos nuevas YA
        List<Liga> ligas = ligaRepository.findAll();
        LocalDateTime ahora = clockService.ahora();
        for (Liga liga : ligas) {
            boolean tieneActivas = subastaRepository.existsByLigaIdAndFinalizadaFalse(liga.getId());
            if (!tieneActivas) {
                log.info("Liga {} sin subastas activas. Generando nuevas...", liga.getNombre());
                
                // Calculamos el próximo fin basado en la hora de creación de la liga
                java.time.LocalTime horaReset = liga.getCreatedAt().toLocalTime();
                LocalDateTime proximoFin = ahora.toLocalDate().atTime(horaReset);
                if (!proximoFin.isAfter(ahora)) {
                    proximoFin = proximoFin.plusDays(1);
                }
                
                generarSubastasConFechaFin(liga, proximoFin);
            } else {
                log.info("Liga {} todavía tiene subastas activas. No se generan nuevas.", liga.getNombre());
            }
        }
    }

    @Transactional
    public String ficharJugador(Long usuarioId, Long jugadorId) {

        // 1. Buscamos el equipo del usuario
        Equipo equipo = equipoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("El usuario no tiene un equipo creado."));

        // 2. Buscamos al jugador en el mercado
        Jugador jugador = jugadorRepository.findById(jugadorId)
                .orElseThrow(() -> new RuntimeException("El jugador no existe en la base de datos."));

        // 3. Validamos que no lo tenga ya fichado
        if (plantillaRepository.existsByEquipoIdAndJugadorId(equipo.getId(), jugador.getId())) {
            throw new RuntimeException("¡Ya tienes a este jugador en tu plantilla!");
        }

        // 4. Comprobamos la cartera (saldo)
        if (equipo.getPresupuestoDisponible() < jugador.getPrecioActual()) {
            throw new RuntimeException("Presupuesto insuficiente. Tienes " + equipo.getPresupuestoDisponible()
                    + " y cuesta " + jugador.getPrecioActual());
        }

        // 5. ¡Ejecutamos la compra! Restamos el dinero
        equipo.setPresupuestoDisponible(equipo.getPresupuestoDisponible() - jugador.getPrecioActual());
        equipoRepository.save(equipo);

        // Incrementar comprasHoy
        int actualesC = (jugador.getComprasHoy() != null) ? jugador.getComprasHoy() : 0;
        jugador.setComprasHoy(actualesC + 1);
        jugadorRepository.save(jugador);

        // 6. Añadimos el jugador a la plantilla (por defecto al banquillo)
        Plantilla nuevoFichaje = new Plantilla();
        nuevoFichaje.setEquipo(equipo);
        nuevoFichaje.setJugador(jugador);
        nuevoFichaje.setEstado(EstadoAlineacion.BANQUILLO);
        plantillaRepository.save(nuevoFichaje);

        // 7. Notificar al usuario
        notificationService.enviarNotificacion(
            equipo.getUsuario().getPushToken(),
            "¡Fichaje Confirmado!",
            "Has fichado a " + jugador.getNickname() + " por " + jugador.getPrecioActual() + " €."
        );

        // 8. Crear noticia en el muro
        noticiaService.crearNoticia(
            equipo.getLiga().getId(),
            TipoNoticia.FICHAJE,
            String.format("¡%s ha fichado a %s por %.0f €!", 
                equipo.getUsuario().getNickname(), 
                jugador.getNickname(), 
                jugador.getPrecioActual()),
            jugador.getId(),
            equipo.getId(),
            jugador.getImagenUrl()
        );

        return "¡Fichaje exitoso! Has fichado a " + jugador.getNickname() +
                ". Saldo restante: " + equipo.getPresupuestoDisponible();
    }

    @Transactional
    public String ejecutarClausulazo(Long compradorUsuarioId, Long jugadorId, Long ligaId) {
        // 1. Buscamos el equipo del comprador
        Equipo equipoComprador = equipoRepository.findByUsuarioIdAndLigaId(compradorUsuarioId, ligaId)
                .orElseThrow(() -> new RuntimeException("No tienes un equipo en esta liga."));

        // 2. Buscamos al jugador y su relación actual en la plantilla
        Plantilla relacionActual = plantillaRepository.findAll().stream()
                .filter(p -> p.getJugador().getId().equals(jugadorId) && p.getEquipo().getLiga().getId().equals(ligaId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Este jugador no pertenece a ningún equipo de esta liga."));

        Equipo equipoVictima = relacionActual.getEquipo();
        Jugador jugador = relacionActual.getJugador();

        if (equipoVictima.getId().equals(equipoComprador.getId())) {
            throw new RuntimeException("No puedes robarte a ti mismo... aunque sería divertido.");
        }

        // 3. Calculamos la cláusula (150% del valor de mercado - Redondeado)
        double precioClausula = Math.round(jugador.getPrecioActual() * 1.5);

        // 4. Validamos presupuesto
        if (equipoComprador.getPresupuestoDisponible() < precioClausula) {
            throw new RuntimeException("Presupuesto insuficiente. La cláusula de " + jugador.getNickname() + 
                " es de " + String.format("%.0f", precioClausula) + " €.");
        }

        // 5. Transferencia de dinero
        equipoComprador.setPresupuestoDisponible(equipoComprador.getPresupuestoDisponible() - precioClausula);
        equipoVictima.setPresupuestoDisponible(equipoVictima.getPresupuestoDisponible() + precioClausula);

        // Incrementar comprasHoy
        int actualesC = (jugador.getComprasHoy() != null) ? jugador.getComprasHoy() : 0;
        jugador.setComprasHoy(actualesC + 1);
        jugadorRepository.save(jugador);

        // 6. Transferencia de jugador
        plantillaRepository.delete(relacionActual);
        
        Plantilla nuevaRelacion = new Plantilla();
        nuevaRelacion.setEquipo(equipoComprador);
        nuevaRelacion.setJugador(jugador);
        nuevaRelacion.setEstado(EstadoAlineacion.BANQUILLO);
        plantillaRepository.save(nuevaRelacion);

        equipoRepository.save(equipoComprador);
        equipoRepository.save(equipoVictima);

        // 7. Notificaciones
        // Al comprador
        notificationService.enviarNotificacion(
            equipoComprador.getUsuario().getPushToken(),
            "¡CLAUSULAZO EJECUTADO!",
            "Has pagado la cláusula de " + jugador.getNickname() + " por " + String.format("%.0f", precioClausula) + " €."
        );

        // Al "robado" (pánico)
        notificationService.enviarNotificacion(
            equipoVictima.getUsuario().getPushToken(),
            "¡TE HAN ROBADO UN JUGADOR!",
            equipoComprador.getUsuario().getNickname() + " ha pagado la cláusula de " + jugador.getNickname() + 
            ". Has recibido " + String.format("%.0f", precioClausula) + " €."
        );

        // 8. Crear noticia en el muro
        noticiaService.crearNoticia(
            ligaId,
            TipoNoticia.CLAUSULAZO,
            String.format("¡ROBO! %s ha pagado la cláusula de %s (%.0f €) al equipo de %s.", 
                equipoComprador.getUsuario().getNickname(), 
                jugador.getNickname(), 
                precioClausula,
                equipoVictima.getUsuario().getNickname()),
            jugador.getId(),
            equipoComprador.getId(),
            jugador.getImagenUrl()
        );

        return "Has pagado la cláusula de " + jugador.getNickname() + " con éxito.";
    }

    @Transactional
    public String cambiarEstadoAlineacion(Long equipoId, Long jugadorId) {

        Plantilla registro = plantillaRepository.findByEquipoIdAndJugadorId(equipoId, jugadorId)
                .orElseThrow(() -> new RuntimeException("Este jugador no pertenece a tu equipo."));

        if (registro.getEstado() == EstadoAlineacion.BANQUILLO) {

            // 1. Nos traemos a todos los titulares actuales
            List<Plantilla> titularesActuales = plantillaRepository.findByEquipoIdAndEstado(equipoId,
                    EstadoAlineacion.TITULAR);

            // 2. Comprobamos el límite de 5 por si acaso
            if (titularesActuales.size() >= 5) {
                throw new RuntimeException("Ya tienes 5 titulares. Debes sentar a alguien primero.");
            }

            // 3. LA MAGIA: Comprobamos si ya hay alguien jugando en ese rol
            String rolDelNuevo = registro.getJugador().getRol().toUpperCase();
            if (rolDelNuevo.equals("ADC")) rolDelNuevo = "BOT";

            final String rolFinal = rolDelNuevo;

            boolean posicionOcupada = titularesActuales.stream()
                    .anyMatch(titular -> {
                        String rolTitular = titular.getJugador().getRol().toUpperCase();
                        if (rolTitular.equals("ADC")) rolTitular = "BOT";
                        return rolTitular.equals(rolFinal);
                    });

            if (posicionOcupada) {
                throw new RuntimeException(
                        "Operación denegada: Ya tienes a un jugador titular en la posición de " + rolFinal + ".");
            }

            // 4. Si pasa todas las aduanas, lo hacemos titular
            registro.setEstado(EstadoAlineacion.TITULAR);
            plantillaRepository.save(registro);
            return "¡" + registro.getJugador().getNickname() + " ahora es titular en la posición de " + rolFinal
                    + "!";

        } else {
            // Si ya era titular, simplemente lo sentamos
            registro.setEstado(EstadoAlineacion.BANQUILLO);
            plantillaRepository.save(registro);
            return registro.getJugador().getNickname() + " ha sido enviado al banquillo.";
        }
    }

    @Transactional
    public String venderJugador(Long equipoId, Long jugadorId) {

        // 1. Buscamos el registro en la plantilla
        Plantilla registro = plantillaRepository.findByEquipoIdAndJugadorId(equipoId, jugadorId)
                .orElseThrow(() -> new RuntimeException("No puedes vender a un jugador que no está en tu equipo."));

        // Extraemos el equipo y el jugador de ese registro para trabajar más cómodos
        Equipo equipo = registro.getEquipo();
        Jugador jugador = registro.getJugador();

        // 2. Ingresamos el dinero en la cuenta del equipo
        double nuevoSaldo = equipo.getPresupuestoDisponible() + jugador.getPrecioActual();
        equipo.setPresupuestoDisponible(nuevoSaldo);
        equipoRepository.save(equipo);

        // Incrementar ventasHoy
        int actualesV = (jugador.getVentasHoy() != null) ? jugador.getVentasHoy() : 0;
        jugador.setVentasHoy(actualesV + 1);
        jugadorRepository.save(jugador);

        // 3. Borramos la fila de la tabla intermedia
        plantillaRepository.delete(registro);

        // 4. Crear noticia en el muro
        noticiaService.crearNoticia(
            equipo.getLiga().getId(),
            TipoNoticia.VENTA,
            String.format("%s ha vendido a %s al mercado por %.0f €.", 
                equipo.getUsuario().getNickname(), 
                jugador.getNickname(), 
                jugador.getPrecioActual()),
            jugador.getId(),
            equipo.getId(),
            jugador.getImagenUrl()
        );

        return "Has vendido a " + jugador.getNickname() + " por " + jugador.getPrecioActual()
                + " monedas. Tu nuevo saldo es: " + nuevoSaldo;
    }
}