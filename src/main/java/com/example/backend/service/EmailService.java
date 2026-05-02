package com.example.backend.service;

import com.nylas.NylasClient;
import com.nylas.models.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class EmailService {

    @Value("${nylas.api.key}")
    private String apiKey;
    
    @Value("${mail.from:noreply@sjcsupplies.nylas.email}")
    private String fromEmail;
    
    @Value("${mail.from.name:SJC Supplies}")
    private String fromName;

    private NylasClient nylasClient;

    @PostConstruct
    public void init() {
        nylasClient = new NylasClient.Builder(apiKey).build();
    }

    public void sendHtmlOtpEmail(String toEmail, String otpCode, String purpose) {
        try {
            String subject = getSubject(purpose);
            String htmlContent = getOtpHtmlTemplate(otpCode, purpose);
            
            SendEmailRequest request = new SendEmailRequest.Builder()
                .from(fromEmail, fromName)
                .to(toEmail)
                .subject(subject)
                .htmlBody(htmlContent)
                .build();
            
            SendMessageResponse response = nylasClient.messages().send(request);
            System.out.println("✅ OTP Email sent via Nylas to: " + toEmail);
            
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void sendWelcomeEmail(String toEmail, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Welcome to SJC Supply Hub!</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your account has been successfully verified.</p>" +
            "<p>You can now login and start ordering school supplies.</p>" +
            "</div>",
            name
        );
        
        try {
            SendEmailRequest request = new SendEmailRequest.Builder()
                .from(fromEmail, fromName)
                .to(toEmail)
                .subject("Welcome to SJC Supply Hub!")
                .htmlBody(htmlContent)
                .build();
            
            nylasClient.messages().send(request);
            System.out.println("✅ Welcome email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    public void sendPasswordResetEmail(String toEmail, String otpCode, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Password Reset Request</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your OTP code for password reset is: <strong>%s</strong></p>" +
            "<p>This code will expire in 5 minutes.</p>" +
            "</div>",
            name, otpCode
        );
        
        try {
            SendEmailRequest request = new SendEmailRequest.Builder()
                .from(fromEmail, fromName)
                .to(toEmail)
                .subject("Password Reset Request")
                .htmlBody(htmlContent)
                .build();
            
            nylasClient.messages().send(request);
            System.out.println("✅ Password reset email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    public void sendPasswordChangedEmail(String toEmail, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Password Changed Successfully</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your password has been successfully changed.</p>" +
            "</div>",
            name
        );
        
        try {
            SendEmailRequest request = new SendEmailRequest.Builder()
                .from(fromEmail, fromName)
                .to(toEmail)
                .subject("Password Changed Successfully")
                .htmlBody(htmlContent)
                .build();
            
            nylasClient.messages().send(request);
            System.out.println("✅ Password changed email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Nylas error: " + e.getMessage());
        }
    }
    
    private String getSubject(String purpose) {
        if ("REGISTRATION".equals(purpose)) {
            return "Verify Your Email - SJC Supply Hub";
        } else if ("PASSWORD_RESET".equals(purpose)) {
            return "Password Reset Request - SJC Supply Hub";
        }
        return "Your OTP Code - SJC Supply Hub";
    }
    
    private String getOtpHtmlTemplate(String otpCode, String purpose) {
        return String.format(
            "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>SJC Supply Hub</h2>" +
            "<p>Your OTP verification code is:</p>" +
            "<h1 style='font-size: 36px; color: #4F46E5; letter-spacing: 5px;'>%s</h1>" +
            "<p>This code will expire in <strong>5 minutes</strong>.</p>" +
            "</div>",
            otpCode
        );
    }
    
    // Backward compatibility
    public void sendOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "OTP");
    }
    
    public void sendRegistrationOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "REGISTRATION");
    }
}
