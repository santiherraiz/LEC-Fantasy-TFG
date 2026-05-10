package com.lecfantasy.backend.service;

import com.lecfantasy.backend.entity.Liga;
import com.lecfantasy.backend.entity.NoticiaLiga;
import com.lecfantasy.backend.entity.TipoNoticia;
import com.lecfantasy.backend.repository.LigaRepository;
import com.lecfantasy.backend.repository.NoticiaLigaRepository;
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
