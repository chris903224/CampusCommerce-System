package com.example.backend.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;

@Service
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String apiKey;
    
    @Value("${mail.from:suppliessjc@gmail.com}")
    private String fromEmail;

    // Send OTP email via SendGrid
    public void sendHtmlOtpEmail(String toEmail, String otpCode, String purpose) {
        System.out.println("📧 Sending OTP via SendGrid to: " + toEmail);
        System.out.println("🔑 OTP Code: " + otpCode);
        
        String subject = getSubject(purpose);
        String htmlContent = getOtpHtmlTemplate(otpCode, purpose);
        
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            System.out.println("✅ OTP email sent via SendGrid. Status: " + response.getStatusCode());
        } catch (IOException ex) {
            System.err.println("❌ SendGrid error: " + ex.getMessage());
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
        
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, "🎉 Welcome to SJC Supply Hub!", to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            System.out.println("✅ Welcome email sent. Status: " + response.getStatusCode());
        } catch (IOException ex) {
            System.err.println("❌ SendGrid error: " + ex.getMessage());
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
        
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, "🔐 Password Reset Request", to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            System.out.println("✅ Password reset email sent. Status: " + response.getStatusCode());
        } catch (IOException ex) {
            System.err.println("❌ SendGrid error: " + ex.getMessage());
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
        
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, "🔐 Password Changed Successfully", to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            System.out.println("✅ Password changed email sent. Status: " + response.getStatusCode());
        } catch (IOException ex) {
            System.err.println("❌ SendGrid error: " + ex.getMessage());
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
    
    // For backward compatibility - keep these method signatures
    public void sendOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "OTP");
    }
    
    public void sendRegistrationOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "REGISTRATION");
    }
}
