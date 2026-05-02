package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestEmailController {
    
    @Value("${nylas.api.key}")
    private String apiKey;
    
    @Value("${mail.from:noreply@suppliessjc.nylas.email}")
    private String fromEmail;
    
    @Value("${mail.from.name:SJC Supplies}")
    private String fromName;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @GetMapping("/test-email")
    public Map<String, Object> testEmail() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> payload = new HashMap<>();
            
            Map<String, String> from = new HashMap<>();
            from.put("email", fromEmail);
            from.put("name", fromName);
            payload.put("from", from);
            
            Map<String, String> to = new HashMap<>();
            to.put("email", "christianvillanuevac9@gmail.com");
            payload.put("to", new Map[]{to});
            
            payload.put("subject", "✅ TEST EMAIL FROM SJC SUPPLY (via Nylas)");
            payload.put("html", "<p>Hello! Working na ang email setup mo gamit ang Nylas!</p>" +
                               "<p>Date: " + new java.util.Date().toString() + "</p>");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String url = "https://api.us.nylas.com/v3/grants/me/messages/send";
            ResponseEntity<String> nylasResponse = restTemplate.postForEntity(url, request, String.class);
            
            response.put("success", true);
            response.put("message", "Email sent successfully via Nylas! Status: " + nylasResponse.getStatusCode());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Email failed: " + e.getMessage());
        }
        
        return response;
    }
}
