package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.entity.NoticiaLiga;
import com.lecfantasy.backend.entity.TipoNoticia;
import com.lecfantasy.backend.repository.LigaRepository;
import com.lecfantasy.backend.repository.NoticiaLigaRepository;
import com.lecfantasy.backend.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoticiaService {

    @Autowired
    private NoticiaLigaRepository noticiaRepository;

    @Autowired
    private LigaRepository ligaRepository;

    @Autowired
    private ClockService clockService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EquipoRepository equipoRepository;

    @Transactional
    public void crearNoticia(Long ligaId, TipoNoticia tipo, String mensaje, Long jugadorId, Long equipoId,
            String imagenUrl) {
        Liga liga = ligaRepository.findById(ligaId)
                .orElseThrow(() -> new RuntimeException("Liga no encontrada para crear noticia"));

        NoticiaLiga noticia = new NoticiaLiga();
        noticia.setLiga(liga);
        noticia.setTipoNoticia(tipo);
        noticia.setMensaje(mensaje);
        noticia.setFecha(clockService.ahora());
        noticia.setJugadorId(jugadorId);
        noticia.setEquipoId(equipoId);
        noticia.setImagenUrl(imagenUrl);

        noticiaRepository.save(noticia);

        // Enviar notificación push a todos los usuarios de la liga
        try {
            equipoRepository.findAllByLigaIdOrderByPuntuacionTotalDesc(ligaId).forEach(equipo -> {
                String token = equipo.getUsuario().getPushToken();
                if (token != null && !token.isEmpty()) {
                    notificationService.enviarNotificacion(
                        token,
                        "Novedad en " + liga.getNombre(),
                        mensaje
                    );
                }
            });
        } catch (Exception e) {
            // No bloqueamos la creación de la noticia si falla el envío de notificaciones
            System.err.println("Error enviando notificaciones de noticia: " + e.getMessage());
        }
    }

    @Transactional
    public void crearNoticiaParaTodasLasLigas(TipoNoticia tipo, String mensaje, Long jugadorId, Long equipoId,
            String imagenUrl) {
        ligaRepository.findAll().forEach(liga -> {
            crearNoticia(liga.getId(), tipo, mensaje, jugadorId, equipoId, imagenUrl);
        });
    }

    public Page<NoticiaLiga> obtenerNoticias(Long ligaId, int pagina, int size) {
        return noticiaRepository.findByLigaIdOrderByFechaDesc(ligaId, PageRequest.of(pagina, size));
    }
}
