package com.example.backend.controller;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestEmailController {
    
    @Value("${resend.api.key}")
    private String resendApiKey;
    
    @GetMapping("/test-email")
    public Map<String, Object> testEmail() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Resend resend = new Resend(resendApiKey);
            
            SendEmailRequest request = SendEmailRequest.builder()
                .from("SJC Supply <onboarding@resend.dev>")
                .to("christianvillanuevac9@gmail.com")
                .subject("✅ TEST EMAIL FROM SJC SUPPLY")
                .html("<p>Hello! Working na ang email setup mo!</p><p>Date: " + new java.util.Date().toString() + "</p>")
                .build();

            resend.emails().send(request);
            
            response.put("success", true);
            response.put("message", "Email sent successfully via Resend!");
            
        } catch (ResendException e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Email failed: " + e.getMessage());
        }
        
        return response;
    }
}
