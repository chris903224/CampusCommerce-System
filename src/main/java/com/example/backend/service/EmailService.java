package com.example.backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String apiKey;
    
    @Value("${mail.from:onboarding@resend.dev}")
    private String fromEmail;

    private Resend resend;

    @PostConstruct
    public void init() {
        resend = new Resend(apiKey);
    }

    // Send OTP email via Resend
    public void sendHtmlOtpEmail(String toEmail, String otpCode, String purpose) {
        System.out.println("📧 Sending OTP via Resend to: " + toEmail);
        System.out.println("🔑 OTP Code: " + otpCode);
        
        String subject = getSubject(purpose);
        String htmlContent = getOtpHtmlTemplate(otpCode, purpose);

        SendEmailRequest request = SendEmailRequest.builder()
                .from(fromEmail)
                .to(toEmail)
                .subject(subject)
                .html(htmlContent)
                .build();

        try {
            resend.emails().send(request);
            System.out.println("✅ OTP email sent via Resend. Status: 200 OK");
        } catch (ResendException e) {
            System.err.println("❌ Resend error: " + e.getMessage());
        }
    }
    
    // Welcome email
    public void sendWelcomeEmail(String toEmail, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Welcome to SJC Supply Hub!</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your account has been successfully verified.</p>" +
            "<p>You can now login and start ordering school supplies.</p>" +
            "<br/><p>Best regards,<br/>SJC Supply Team</p></div>",
            name
        );

        SendEmailRequest request = SendEmailRequest.builder()
                .from(fromEmail)
                .to(toEmail)
                .subject("🎉 Welcome to SJC Supply Hub!")
                .html(htmlContent)
                .build();

        try {
            resend.emails().send(request);
            System.out.println("✅ Welcome email sent via Resend");
        } catch (ResendException e) {
            System.err.println("❌ Resend error: " + e.getMessage());
        }
    }
    
    // Password reset email
    public void sendPasswordResetEmail(String toEmail, String otpCode, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Password Reset Request</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your OTP code for password reset is:</p>" +
            "<h1 style='font-size: 36px; color: #4F46E5; letter-spacing: 5px;'>%s</h1>" +
            "<p>This code will expire in <strong>5 minutes</strong>.</p>" +
            "<br/><p>If you did not request this, please ignore this email.</p></div>",
            name, otpCode
        );

        SendEmailRequest request = SendEmailRequest.builder()
                .from(fromEmail)
                .to(toEmail)
                .subject("🔐 Password Reset Request")
                .html(htmlContent)
                .build();

        try {
            resend.emails().send(request);
            System.out.println("✅ Password reset email sent via Resend");
        } catch (ResendException e) {
            System.err.println("❌ Resend error: " + e.getMessage());
        }
    }
    
    // Password changed confirmation email
    public void sendPasswordChangedEmail(String toEmail, String name) {
        String htmlContent = String.format(
            "<div style='font-family: Arial; padding: 20px;'>" +
            "<h2 style='color: #4F46E5;'>Password Changed Successfully</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>Your password has been successfully changed.</p>" +
            "<p>If you did not make this change, please contact support immediately.</p>" +
            "<br/><p>Best regards,<br/>SJC Supply Team</p></div>",
            name
        );

        SendEmailRequest request = SendEmailRequest.builder()
                .from(fromEmail)
                .to(toEmail)
                .subject("🔐 Password Changed Successfully")
                .html(htmlContent)
                .build();

        try {
            resend.emails().send(request);
            System.out.println("✅ Password changed email sent via Resend");
        } catch (ResendException e) {
            System.err.println("❌ Resend error: " + e.getMessage());
        }
    }
    
    // Helper methods
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
    
    // For backward compatibility
    public void sendOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "OTP");
    }
    
    public void sendRegistrationOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "REGISTRATION");
    }
}
