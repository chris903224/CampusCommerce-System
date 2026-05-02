package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    // Simple text email
    public void sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("🔐 Your OTP Code - SJCSupply Hub");
            message.setText("Your OTP is: " + otp + "\n\nThis code will expire in 5 minutes.\n\nThank you for using SJCSupply Hub!");
            message.setFrom("sjcsuppliessjc@gmail.com");
            
            mailSender.send(message);
            System.out.println("✅ Email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // HTML Email with purpose
    public void sendHtmlOtpEmail(String to, String otp, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🔐 " + purpose + " - SJCSupply Hub");
            helper.setFrom("sjcsuppliessjc@gmail.com");
            
            String htmlContent = generateOtpEmailTemplate(otp, purpose);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("✅ HTML Email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ HTML Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // ✅ NEW: Password Reset Email with name
    public void sendPasswordResetEmail(String to, String otp, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🔐 Password Reset Request - SJCSupply Hub");
            helper.setFrom("sjcsuppliessjc@gmail.com");
            
            String htmlContent = generatePasswordResetTemplate(otp, name);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("✅ Password reset email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ Password reset email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // ✅ NEW: Password Reset Email (without name - simpler)
    public void sendPasswordResetEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "Password Reset");
    }
    
    // Registration Verification Email
    public void sendRegistrationOtpEmail(String to, String otp) {
        sendHtmlOtpEmail(to, otp, "Email Verification");
    }
    
    // Welcome Email
    public void sendWelcomeEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🎉 Welcome to SJCSupply Hub!");
            helper.setFrom("sjcsuppliessjc@gmail.com");
            
            String htmlContent = generateWelcomeEmailTemplate(name);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("✅ Welcome email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ Welcome email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Password Changed Confirmation Email
    public void sendPasswordChangedEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🔒 Password Changed - SJCSupply Hub");
            helper.setFrom("sjcsuppliessjc@gmail.com");
            
            String htmlContent = generatePasswordChangedTemplate(name);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("✅ Password changed email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ Password changed email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Generic HTML Email
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("sjcsuppliessjc@gmail.com");
            
            mailSender.send(message);
            System.out.println("✅ HTML Email sent to: " + to);
            
        } catch (Exception e) {
            System.out.println("❌ HTML Email error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // ==================== EMAIL TEMPLATES ====================
    
    private String generateOtpEmailTemplate(String otp, String purpose) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }" +
            ".container { max-width: 500px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }" +
            ".header { background: linear-gradient(135deg, #00fbff, #00c8ff); padding: 30px; text-align: center; }" +
            ".header h1 { color: white; margin: 0; font-size: 28px; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".otp-box { background: #f8f9fa; border: 2px dashed #00fbff; border-radius: 10px; padding: 20px; margin: 20px 0; }" +
            ".otp-code { font-size: 42px; font-weight: bold; color: #00fbff; letter-spacing: 8px; }" +
            ".timer { color: #f56565; font-size: 14px; margin-top: 15px; }" +
            ".footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }" +
            ".highlight { color: #00fbff; font-weight: bold; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>🔐 " + purpose + "</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<h2 style='color: #333; margin-bottom: 20px;'>Hello!</h2>" +
            "<p style='color: #666; font-size: 16px; margin-bottom: 30px;'>Use the OTP code below to complete your " + purpose.toLowerCase() + ".</p>" +
            "<div class='otp-box'>" +
            "<div class='otp-code'>" + otp + "</div>" +
            "</div>" +
            "<div class='timer'>⚠️ This code will expire in <span class='highlight'>5 minutes</span></div>" +
            "<p style='color: #999; font-size: 14px; margin-top: 30px;'>If you didn't request this, please ignore this email.</p>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>© 2026 SJCSupply Hub. All rights reserved.</p>" +
            "<p>Your trusted school supplies partner</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
    
    // ✅ NEW: Password Reset Template with name
    private String generatePasswordResetTemplate(String otp, String name) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }" +
            ".container { max-width: 500px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }" +
            ".header { background: linear-gradient(135deg, #f56565, #e53e3e); padding: 30px; text-align: center; }" +
            ".header h1 { color: white; margin: 0; font-size: 28px; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".otp-box { background: #f8f9fa; border: 2px dashed #f56565; border-radius: 10px; padding: 20px; margin: 20px 0; }" +
            ".otp-code { font-size: 42px; font-weight: bold; color: #f56565; letter-spacing: 8px; }" +
            ".timer { color: #f56565; font-size: 14px; margin-top: 15px; }" +
            ".footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>🔐 Password Reset Request</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<h2 style='color: #333; margin-bottom: 20px;'>Hello " + name + "!</h2>" +
            "<p style='color: #666; font-size: 16px; margin-bottom: 30px;'>We received a request to reset your password. Use the OTP code below:</p>" +
            "<div class='otp-box'>" +
            "<div class='otp-code'>" + otp + "</div>" +
            "</div>" +
            "<div class='timer'>⚠️ This code will expire in <span class='highlight' style='color:#f56565;'>5 minutes</span></div>" +
            "<p style='color: #666; font-size: 14px; margin-top: 30px;'>If you didn't request this, please ignore this email.</p>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>© 2026 SJCSupply Hub. All rights reserved.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
    
    private String generateWelcomeEmailTemplate(String name) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }" +
            ".container { max-width: 500px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }" +
            ".header { background: linear-gradient(135deg, #4ade80, #10b981); padding: 30px; text-align: center; }" +
            ".header h1 { color: white; margin: 0; font-size: 28px; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".button { background: linear-gradient(135deg, #00fbff, #00c8ff); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }" +
            ".footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>🎉 Welcome to SJCSupply Hub!</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<h2 style='color: #333;'>Hello " + name + "!</h2>" +
            "<p style='color: #666; font-size: 16px; line-height: 1.6;'>Thank you for joining SJCSupply Hub! We're excited to have you as part of our community.</p>" +
            "<p style='color: #666; font-size: 16px; line-height: 1.6;'>You can now browse and purchase quality school supplies with ease.</p>" +
            "<a href='http://localhost:8080/dashboard' class='button'>Go to Dashboard</a>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>© 2026 SJCSupply Hub. All rights reserved.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
    
    private String generatePasswordChangedTemplate(String name) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }" +
            ".container { max-width: 500px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }" +
            ".header { background: linear-gradient(135deg, #f56565, #e53e3e); padding: 30px; text-align: center; }" +
            ".header h1 { color: white; margin: 0; font-size: 28px; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>🔒 Password Changed</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<h2 style='color: #333;'>Hello " + name + "!</h2>" +
            "<p style='color: #666; font-size: 16px; line-height: 1.6;'>Your password has been successfully changed.</p>" +
            "<p style='color: #f56565; font-size: 14px; margin-top: 20px;'>If you didn't make this change, please contact support immediately.</p>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>© 2026 SJCSupply Hub. All rights reserved.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
}