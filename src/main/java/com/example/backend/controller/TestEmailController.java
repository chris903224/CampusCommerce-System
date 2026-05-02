package com.example.backend.controller;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestEmailController {
    
    @Value("${sendgrid.api.key}")
    private String sendgridApiKey;
    
    @GetMapping("/test-email")
    public Map<String, Object> testEmail() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Email from = new Email("suppliessjc@gmail.com");
            Email to = new Email("christianvillanuevac9@gmail.com");
            String subject = "✅ TEST EMAIL FROM SJC SUPPLY";
            Content content = new Content("text/plain", 
                "Hello! Working na ang email setup mo!\n\n" +
                "From: SJC Supply Backend (via SendGrid)\n" +
                "Date: " + new java.util.Date().toString());
            
            Mail mail = new Mail(from, subject, to, content);
            
            SendGrid sg = new SendGrid(sendgridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response responseGrid = sg.api(request);
            
            response.put("success", true);
            response.put("message", "Email sent successfully via SendGrid! Status: " + responseGrid.getStatusCode());
            
        } catch (IOException e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Email failed: " + e.getMessage());
        }
        
        return response;
    }
}
