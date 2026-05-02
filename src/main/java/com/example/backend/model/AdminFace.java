package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_faces")
public class AdminFace {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "admin_email", nullable = false)
    private String adminEmail;
    
    @Column(name = "face_descriptor", columnDefinition = "TEXT", nullable = false)
    private String faceDescriptor;
    
    @Column(name = "registered_at")
    private LocalDateTime registeredAt;
    
    @Column(name = "last_verified_at")  // ADD THIS FIELD
    private LocalDateTime lastVerifiedAt;
    
    // Constructors
    public AdminFace() {}
    
    public AdminFace(String adminEmail, String faceDescriptor, LocalDateTime registeredAt) {
        this.adminEmail = adminEmail;
        this.faceDescriptor = faceDescriptor;
        this.registeredAt = registeredAt;
    }
    
    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public String getAdminEmail() { 
        return adminEmail; 
    }
    
    public void setAdminEmail(String adminEmail) { 
        this.adminEmail = adminEmail; 
    }
    
    public String getFaceDescriptor() { 
        return faceDescriptor; 
    }
    
    public void setFaceDescriptor(String faceDescriptor) { 
        this.faceDescriptor = faceDescriptor; 
    }
    
    public LocalDateTime getRegisteredAt() { 
        return registeredAt; 
    }
    
    public void setRegisteredAt(LocalDateTime registeredAt) { 
        this.registeredAt = registeredAt; 
    }
    
    // ADD THESE GETTER AND SETTER
    public LocalDateTime getLastVerifiedAt() { 
        return lastVerifiedAt; 
    }
    
    public void setLastVerifiedAt(LocalDateTime lastVerifiedAt) { 
        this.lastVerifiedAt = lastVerifiedAt; 
    }
}