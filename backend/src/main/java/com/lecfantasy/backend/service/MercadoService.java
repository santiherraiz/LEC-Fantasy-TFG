package com.lecfantasy.backend.service;

import com.lecfantasy.backend.dto.PujaRequest;
import com.lecfantasy.backend.dto.SubastaDTO;
import com.lecfantasy.backend.entity.*;
import com.lecfantasy.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MercadoService {

    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private PlantillaRepository plantillaRepository;
    @Autowired
    private SubastaRepository subastaRepository;
    @Autowired
    private PujaRepository pujaRepository;
    @Autowired
    private LigaRepository ligaRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private EstadisticaPartidoRepository estadisticaPartidoRepository;

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

    public List<com.lecfantasy.backend.dto.CatalogoJugadorDTO> obtenerCatalogo(Long ligaId) {
        List<Jugador> todos = jugadorRepository.findAll();
        List<Plantilla> ocupados = plantillaRepository.findByEquipoLigaId(ligaId);
        
        java.util.Map<Long, String> propietarios = ocupados.stream()
            .collect(Collectors.toMap(
                p -> p.getJugador().getId(),
                p -> p.getEquipo().getUsuario().getNickname(),
                (v1, v2) -> v1
            ));

        return todos.stream().map(j -> {
            com.lecfantasy.backend.dto.CatalogoJugadorDTO dto = new com.lecfantasy.backend.dto.CatalogoJugadorDTO();
            dto.setJugador(j);
            dto.setPropietarioNickname(propietarios.get(j.getId()));
            
            List<EstadisticaPartido> stats = estadisticaPartidoRepository.findByJugadorId(j.getId());
            double media = stats.stream()
                .mapToDouble(EstadisticaPartido::getPuntosGenerados)
                .average()
                .orElse(0.0);
            dto.setPuntosMedia(Math.round(media * 10.0) / 10.0);
            
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public String pujar(PujaRequest request) {
        Subasta subasta = subastaRepository.findById(request.getSubastaId())
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.isFinalizada() || subasta.getFechaFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("La subasta ya ha finalizado");
        }

        if (request.getCantidad() < subasta.getJugador().getPrecioBase()) {
            throw new RuntimeException("La puja mínima es de " + subasta.getJugador().getPrecioBase());
        }

        Equipo equipo = equipoRepository.findByUsuarioId(request.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("El usuario no tiene equipo"));

        // Comprobamos si ya tiene una puja para actualizarla o crear una nueva
        Optional<Puja> pujaExistente = pujaRepository.findBySubastaIdAndUsuarioId(subasta.getId(), request.getUsuarioId());
        
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
            puja.setFechaPuja(LocalDateTime.now());
            pujaRepository.save(puja);
        } else {
            Puja nuevaPuja = new Puja();
            nuevaPuja.setSubasta(subasta);
            nuevaPuja.setUsuario(usuarioRepository.findById(request.getUsuarioId()).get());
            nuevaPuja.setCantidad(request.getCantidad());
            nuevaPuja.setFechaPuja(LocalDateTime.now());
            pujaRepository.save(nuevaPuja);
        }

        return "Puja realizada con éxito";
    }

    @Transactional
    public String eliminarPuja(Long subastaId, Long usuarioId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));

        if (subasta.isFinalizada() || subasta.getFechaFin().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("La subasta ya ha finalizado, no puedes retirar la puja");
        }

        Puja puja = pujaRepository.findBySubastaIdAndUsuarioId(subastaId, usuarioId)
                .orElseThrow(() -> new RuntimeException("No tienes ninguna puja en esta subasta"));

        Equipo equipo = equipoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("El usuario no tiene equipo"));

        // Devolvemos el dinero al presupuesto
        equipo.setPresupuestoDisponible(equipo.getPresupuestoDisponible() + puja.getCantidad());
        equipoRepository.save(equipo);

        // Borramos la puja
        pujaRepository.delete(puja);

        return "Puja retirada con éxito. Se han devuelto " + puja.getCantidad() + " € a tu presupuesto.";
    }

    @Transactional
    public void generarSubastasConFechaFin(Liga liga, LocalDateTime fechaFin) {
        // 1. Obtener jugadores que ya están en algún equipo de esta liga
        List<Long> jugadoresOcupadosIds = plantillaRepository.findByEquipoLigaId(liga.getId())
                .stream()
                .map(p -> p.getJugador().getId())
                .collect(Collectors.toList());

        // 2. Obtener jugadores que ya están en subasta activa para esta liga
        List<Long> jugadoresEnSubastaIds = subastaRepository.findByLigaIdAndFinalizadaFalse(liga.getId())
                .stream()
                .map(s -> s.getJugador().getId())
                .collect(Collectors.toList());

        jugadoresOcupadosIds.addAll(jugadoresEnSubastaIds);

        // 3. Buscar jugadores disponibles
        List<Jugador> disponibles = jugadorRepository.findAll().stream()
                .filter(j -> !jugadoresOcupadosIds.contains(j.getId()))
                .collect(Collectors.toList());

        Collections.shuffle(disponibles);

        // 4. Crear 5 subastas
        int limite = Math.min(5, disponibles.size());
        LocalDateTime ahora = LocalDateTime.now();

        for (int i = 0; i < limite; i++) {
            Subasta s = new Subasta();
            s.setLiga(liga);
            s.setJugador(disponibles.get(i));
            s.setFechaInicio(ahora);
            s.setFechaFin(fechaFin);
            subastaRepository.save(s);
        }
    }

    @Transactional
    public void resolverSubastasExpiradas() {
        List<Subasta> expiradas = subastaRepository.findByFinalizadaFalseAndFechaFinBefore(LocalDateTime.now());

        for (Subasta s : expiradas) {
            List<Puja> pujas = pujaRepository.findBySubastaIdOrderByCantidadDescFechaPujaAsc(s.getId());
            
            if (!pujas.isEmpty()) {
                Puja ganadora = pujas.get(0);
                
                // El ganador ya pagó al pujar, así que solo le damos el jugador
                Equipo equipoGanador = equipoRepository.findByUsuarioId(ganadora.getUsuario().getId()).get();
                
                Plantilla p = new Plantilla();
                p.setEquipo(equipoGanador);
                p.setJugador(s.getJugador());
                p.setEstado(EstadoAlineacion.BANQUILLO);
                plantillaRepository.save(p);

                // Devolver dinero a los perdedores
                for (int i = 1; i < pujas.size(); i++) {
                    Puja perdedora = pujas.get(i);
                    Equipo equipoPerdedor = equipoRepository.findByUsuarioId(perdedora.getUsuario().getId()).get();
                    equipoPerdedor.setPresupuestoDisponible(equipoPerdedor.getPresupuestoDisponible() + perdedora.getCantidad());
                    equipoRepository.save(equipoPerdedor);
                }
            }
            
            s.setFinalizada(true);
            subastaRepository.save(s);
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
        if (equipo.getPresupuestoDisponible() < jugador.getPrecioBase()) {
            throw new RuntimeException("Presupuesto insuficiente. Tienes " + equipo.getPresupuestoDisponible() + " y cuesta " + jugador.getPrecioBase());
        }

        // 5. ¡Ejecutamos la compra! Restamos el dinero
        equipo.setPresupuestoDisponible(equipo.getPresupuestoDisponible() - jugador.getPrecioBase());
        equipoRepository.save(equipo);

        // 6. Añadimos el jugador a la plantilla (por defecto al banquillo)
        Plantilla nuevoFichaje = new Plantilla();
        nuevoFichaje.setEquipo(equipo);
        nuevoFichaje.setJugador(jugador);
        nuevoFichaje.setEstado(EstadoAlineacion.BANQUILLO);
        plantillaRepository.save(nuevoFichaje);

        return "¡Fichaje exitoso! Has fichado a " + jugador.getNickname() +
                ". Saldo restante: " + equipo.getPresupuestoDisponible();
    }

    @Transactional
    public String cambiarEstadoAlineacion(Long equipoId, Long jugadorId) {

        Plantilla registro = plantillaRepository.findByEquipoIdAndJugadorId(equipoId, jugadorId)
                .orElseThrow(() -> new RuntimeException("Este jugador no pertenece a tu equipo."));

        if (registro.getEstado() == EstadoAlineacion.BANQUILLO) {

            // 1. Nos traemos a todos los titulares actuales
            List<Plantilla> titularesActuales = plantillaRepository.findByEquipoIdAndEstado(equipoId, EstadoAlineacion.TITULAR);

            // 2. Comprobamos el límite de 5 por si acaso
            if (titularesActuales.size() >= 5) {
                throw new RuntimeException("Ya tienes 5 titulares. Debes sentar a alguien primero.");
            }

            // 3. LA MAGIA: Comprobamos si ya hay alguien jugando en ese rol
            String rolDelNuevo = registro.getJugador().getRol();

            boolean posicionOcupada = titularesActuales.stream()
                    .anyMatch(titular -> titular.getJugador().getRol().equals(rolDelNuevo));

            if (posicionOcupada) {
                throw new RuntimeException("Operación denegada: Ya tienes a un jugador titular en la posición de " + rolDelNuevo + ".");
            }

            // 4. Si pasa todas las aduanas, lo hacemos titular
            registro.setEstado(EstadoAlineacion.TITULAR);
            plantillaRepository.save(registro);
            return "¡" + registro.getJugador().getNickname() + " ahora es titular en la posición de " + rolDelNuevo + "!";

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
        double nuevoSaldo = equipo.getPresupuestoDisponible() + jugador.getPrecioBase();
        equipo.setPresupuestoDisponible(nuevoSaldo);
        equipoRepository.save(equipo);

        // 3. Borramos la fila de la tabla intermedia
        plantillaRepository.delete(registro);

        return "Has vendido a " + jugador.getNickname() + " por " + jugador.getPrecioBase() + " monedas. Tu nuevo saldo es: " + nuevoSaldo;
    }
}