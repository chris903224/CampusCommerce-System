package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
public class OtpVerification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String otp;
    
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean verified = false;
    
    // ✅ MAG-DEFAULT VALUE PARA IWAS ERROR
    @Column(nullable = false, columnDefinition = "varchar(255) default 'REGISTRATION'")
    private String type = "REGISTRATION";
    
    public OtpVerification() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(5);
    }
    
    public OtpVerification(String email, String otp, int expiryMinutes) {
        this.email = email;
        this.otp = otp;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
        this.verified = false;
        this.type = "REGISTRATION";
    }
    
    public OtpVerification(String email, String otp, int expiryMinutes, String type) {
        this.email = email;
        this.otp = otp;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
        this.verified = false;
        this.type = type;
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}