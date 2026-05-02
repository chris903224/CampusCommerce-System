package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestEmailController {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @GetMapping("/test-email")
    public Map<String, Object> testEmail() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("christianvillanuevac9@gmail.com");
            message.setSubject("✅ TEST EMAIL FROM SJC SUPPLY");
            message.setText("Hello! Working na ang email setup mo!\n\n" +
                          "From: SJC Supply Backend\n" +
                          "Date: " + new java.util.Date().toString());
            
            mailSender.send(message);
            
            response.put("success", true);
            response.put("message", "Email sent successfully! Check your inbox.");
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Email failed: " + e.getMessage());
        }
        
        return response;
    }
}