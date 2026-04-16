package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Equipo;
import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.entity.Usuario;
import com.lecfantasy.backend.repository.EquipoRepository;
import com.lecfantasy.backend.repository.LigaRepository;
import com.lecfantasy.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LigaService {

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EquipoRepository equipoRepository;

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

        return ligaGuardada;
    }

    @Transactional
    public void unirseALiga(String codigo, Long usuarioId) {
        Liga liga = ligaRepository.findByCodigoAcceso(codigo)
                .orElseThrow(() -> new RuntimeException("Código de liga inválido"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar si ya tiene equipo en esta liga
        if (equipoRepository.findByUsuarioIdAndLigaId(usuarioId, liga.getId()).isPresent()) {
            throw new RuntimeException("Ya eres parte de esta liga");
        }

        crearEquipoEnLiga(usuario, liga);
    }

    private void crearEquipoEnLiga(Usuario usuario, Liga liga) {
        Equipo equipo = new Equipo();
        equipo.setNombreEquipo("Equipo de " + usuario.getNickname());
        equipo.setPresupuestoDisponible(50000.0);
        equipo.setPuntuacionTotal(0.0);
        equipo.setUsuario(usuario);
        equipo.setLiga(liga);
        equipoRepository.save(equipo);
    }

    public List<Liga> obtenerLigasDeUsuario(Long usuarioId) {
        return ligaRepository.findLigasByUsuarioId(usuarioId);
    }
}
