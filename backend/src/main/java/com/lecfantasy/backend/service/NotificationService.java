package com.lecfantasy.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private RestTemplate restTemplate;

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    public void enviarNotificacion(String to, String title, String body) {
        if (to == null || to.isEmpty()) {
            System.out.println("No se puede enviar notificación: El token de destino está vacío.");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> message = new HashMap<>();
            message.put("to", to);
            message.put("title", title);
            message.put("body", body);
            message.put("sound", "default");

            // Expo espera un array de mensajes
            List<Map<String, Object>> bodyList = new ArrayList<>();
            bodyList.add(message);

            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(bodyList, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Notificación enviada con éxito a: " + to);
            } else {
                System.err.println("Error al enviar notificación. Status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            System.err.println("Error enviando notificación push: " + e.getMessage());
        }
    }
}
