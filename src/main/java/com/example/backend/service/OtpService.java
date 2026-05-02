package com.example.backend.service;

import com.example.backend.model.OtpVerification;
import com.example.backend.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {
    
    @Autowired
    private OtpRepository otpRepository;
    
    @Autowired
    private EmailService emailService;
    
    private Random random = new Random();
    
    private String generateOtp() {
        return String.format("%06d", random.nextInt(1000000));
    }
    
    @Transactional
    public boolean sendOtp(String email) {
        try {
            // Delete old OTPs
            otpRepository.deleteByEmail(email);
            
            // Generate new OTP
            String otpCode = generateOtp();
            
            // Save new OTP
            OtpVerification otp = new OtpVerification(email, otpCode, 5);
            otpRepository.save(otp);
            
            // Send email
            emailService.sendOtpEmail(email, otpCode);
            
            System.out.println("✅ OTP sent to: " + email);
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Failed to send OTP: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        System.out.println("🔐 Verifying OTP for: " + email);
        
        Optional<OtpVerification> otpOpt = otpRepository.findByEmailAndOtp(email, otpCode);
        
        if (otpOpt.isPresent()) {
            OtpVerification otp = otpOpt.get();
            
            // Check if expired
            if (otp.isExpired()) {
                System.out.println("❌ OTP expired");
                return false;
            }
            
            // Check if already verified
            if (otp.isVerified()) {
                System.out.println("❌ OTP already used");
                return false;
            }
            
            // Mark as verified
            otp.setVerified(true);
            otpRepository.save(otp);
            
            System.out.println("✅ OTP verified successfully");
            return true;
        }
        
        System.out.println("❌ Invalid OTP");
        return false;
    }
    
    @Transactional
    public boolean resendOtp(String email) {
        try {
            otpRepository.deleteByEmail(email);
            
            String otpCode = generateOtp();
            OtpVerification otp = new OtpVerification(email, otpCode, 5);
            otpRepository.save(otp);
            
            emailService.sendOtpEmail(email, otpCode);
            
            System.out.println("✅ OTP resent to: " + email);
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Failed to resend OTP: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean isOtpValid(String email, String otpCode) {
        Optional<OtpVerification> otpOpt = otpRepository.findByEmailAndOtp(email, otpCode);
        
        if (otpOpt.isPresent()) {
            OtpVerification otp = otpOpt.get();
            return !otp.isExpired() && !otp.isVerified();
        }
        
        return false;
    }
}