package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_sessions")
public class AdminSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 255)
    private String token;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    public AdminSession() {}
    
    public AdminSession(String token, String email, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.token = token;
        this.email = email;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }
    
    // Getters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    
    // Setters
    public void setId(Long id) { this.id = id; }
    public void setToken(String token) { this.token = token; }
    public void setEmail(String email) { this.email = email; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}