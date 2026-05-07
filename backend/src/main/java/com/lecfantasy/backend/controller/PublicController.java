package com.lecfantasy.backend.controller;

import com.lecfantasy.backend.service.ClockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private ClockService clockService;

    @GetMapping("/time")
    public Map<String, Object> getServerTime() {
        Map<String, Object> response = new HashMap<>();
        response.put("serverTime", clockService.ahora());
        response.put("isDemoMode", true); // Podríamos hacerlo dinámico, pero para este caso sirve
        return response;
    }
}
