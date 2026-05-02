package com.example.backend.controller;

import com.example.backend.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private StatsService statsService;
    
    @GetMapping("/{userId}")
    public Map<String, Object> getUserStats(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> stats = statsService.getUserStats(userId);
            
            response.put("success", true);
            response.putAll(stats);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
}