package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.EstadoAlineacion;
import com.lecfantasy.backend.entity.Jugador;
import com.lecfantasy.backend.entity.Plantilla;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.JugadorRepository;
import com.lecfantasy.backend.repository.PlantillaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MercadoService {

    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private PlantillaRepository plantillaRepository;

    @Transactional // ¡Súper importante para operaciones con saldo!
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
}