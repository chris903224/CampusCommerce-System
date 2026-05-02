package com.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${nylas.api.key}")
    private String apiKey;
    
    @Value("${mail.from:noreply@suppliessjc.nylas.email}")
    private String fromEmail;
    
    @Value("${mail.from.name:SJC Supplies}")
    private String fromName;
    
    private final RestTemplate restTemplate = new RestTemplate();

    public void sendHtmlOtpEmail(String toEmail, String otpCode, String purpose) {
        try {
            String subject = getSubject(purpose);
            String htmlContent = getOtpHtmlTemplate(otpCode, purpose);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            // Build the email payload
            Map<String, Object> payload = new HashMap<>();
            
            Map<String, String> from = new HashMap<>();
            from.put("email", fromEmail);
            from.put("name", fromName);
            payload.put("from", from);
            
            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            payload.put("to", new Map[]{to});
            
            payload.put("subject", subject);
            payload.put("html", htmlContent);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            // Nylas API endpoint for sending emails
            String url = "https://api.us.nylas.com/v3/grants/me/messages/send";
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ OTP email sent via Nylas to: " + toEmail);
            } else {
                System.out.println("⚠️ Nylas response: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            String htmlContent = String.format(
                "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
                "<h2 style='color: #4F46E5;'>Welcome to SJC Supply Hub!</h2>" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Your account has been successfully verified.</p>" +
                "<p>You can now login and start ordering school supplies.</p>" +
                "<br/><p>Best regards,<br/>SJC Supply Team</p></div>",
                name
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> payload = new HashMap<>();
            Map<String, String> from = new HashMap<>();
            from.put("email", fromEmail);
            from.put("name", fromName);
            payload.put("from", from);
            
            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            payload.put("to", new Map[]{to});
            
            payload.put("subject", "🎉 Welcome to SJC Supply Hub!");
            payload.put("html", htmlContent);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String url = "https://api.us.nylas.com/v3/grants/me/messages/send";
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            System.out.println("✅ Welcome email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    public void sendPasswordResetEmail(String toEmail, String otpCode, String name) {
        try {
            String htmlContent = String.format(
                "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
                "<h2 style='color: #4F46E5;'>Password Reset Request</h2>" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Your OTP code for password reset is:</p>" +
                "<h1 style='font-size: 36px; color: #4F46E5; letter-spacing: 5px;'>%s</h1>" +
                "<p>This code will expire in <strong>5 minutes</strong>.</p>" +
                "</div>",
                name, otpCode
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> payload = new HashMap<>();
            Map<String, String> from = new HashMap<>();
            from.put("email", fromEmail);
            from.put("name", fromName);
            payload.put("from", from);
            
            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            payload.put("to", new Map[]{to});
            
            payload.put("subject", "🔐 Password Reset Request");
            payload.put("html", htmlContent);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String url = "https://api.us.nylas.com/v3/grants/me/messages/send";
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            System.out.println("✅ Password reset email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    public void sendPasswordChangedEmail(String toEmail, String name) {
        try {
            String htmlContent = String.format(
                "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
                "<h2 style='color: #4F46E5;'>Password Changed Successfully</h2>" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Your password has been successfully changed.</p>" +
                "</div>",
                name
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> payload = new HashMap<>();
            Map<String, String> from = new HashMap<>();
            from.put("email", fromEmail);
            from.put("name", fromName);
            payload.put("from", from);
            
            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            payload.put("to", new Map[]{to});
            
            payload.put("subject", "🔐 Password Changed Successfully");
            payload.put("html", htmlContent);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String url = "https://api.us.nylas.com/v3/grants/me/messages/send";
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            System.out.println("✅ Password changed email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    private String getSubject(String purpose) {
        if ("REGISTRATION".equals(purpose)) {
            return "🔐 Verify Your Email - SJC Supply Hub";
        } else if ("PASSWORD_RESET".equals(purpose)) {
            return "🔐 Password Reset Request - SJC Supply Hub";
        }
        return "🔐 Your OTP Code - SJC Supply Hub";
    }
    
    private String getOtpHtmlTemplate(String otpCode, String purpose) {
        return String.format(
            "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 500px;'>" +
            "<h2 style='color: #4F46E5;'>SJC Supply Hub</h2>" +
            "<p>Your OTP verification code is:</p>" +
            "<h1 style='font-size: 36px; color: #4F46E5; letter-spacing: 5px;'>%s</h1>" +
            "<p>This code will expire in <strong>5 minutes</strong>.</p>" +
            "<hr/><p style='font-size: 12px; color: #666;'>If you did not request this, please ignore this email.</p>" +
            "</div>",
            otpCode
        );
    }
    
    // Backward compatibility methods
    public void sendOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "OTP");
    }
    
    public void sendRegistrationOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "REGISTRATION");
    }
}
