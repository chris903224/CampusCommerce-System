package com.example.backend.dto;

import com.example.backend.model.User;
import java.time.LocalDateTime;

public class UserResponse {
    
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private Boolean isActive;
    private boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    
    // School Information
    private String studentId;
    private String yearLevel;
    private String course;
    private String dateOfBirth;
    private String schoolYear;
    
    // Address Information
    private String address;
    private String city;
    private String postalCode;
    private String country;
    
    // ============ ROOM INFORMATION - BAGO ============
    private String roomBuilding;
    private String roomNumber;
    private String specialDelivery;
    
    // Default constructor
    public UserResponse() {}
    
    // Constructor with User parameter
    public UserResponse(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.isActive = user.getIsActive();
        this.isVerified = user.isVerified();
        this.createdAt = user.getCreatedAt();
        this.lastLogin = user.getLastLogin();
        
        // School Information
        this.studentId = user.getStudentId();
        this.yearLevel = user.getYearLevel();
        this.course = user.getCourse();
        this.dateOfBirth = user.getDateOfBirth();
        this.schoolYear = user.getSchoolYear();
        
        // Address Information
        this.address = user.getAddress();
        this.city = user.getCity();
        this.postalCode = user.getPostalCode();
        this.country = user.getCountry();
        
        // ============ ROOM INFORMATION ============
        this.roomBuilding = user.getRoomBuilding();
        this.roomNumber = user.getRoomNumber();
        this.specialDelivery = user.getSpecialDelivery();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getYearLevel() { return yearLevel; }
    public void setYearLevel(String yearLevel) { this.yearLevel = yearLevel; }
    
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getSchoolYear() { return schoolYear; }
    public void setSchoolYear(String schoolYear) { this.schoolYear = schoolYear; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    // ============ ROOM INFORMATION GETTERS & SETTERS ============
    public String getRoomBuilding() { return roomBuilding; }
    public void setRoomBuilding(String roomBuilding) { this.roomBuilding = roomBuilding; }
    
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    
    public String getSpecialDelivery() { return specialDelivery; }
    public void setSpecialDelivery(String specialDelivery) { this.specialDelivery = specialDelivery; }
}