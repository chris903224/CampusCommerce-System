package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String role = "CUSTOMER";
    private LocalDateTime createdAt;
    private Boolean isActive = true;
    private boolean isVerified = false;
    
    // Profile fields
    private String phone;
    private String address;
    private String city;
    private String postalCode;
    private String country = "Philippines";
    
    // ============ PROFILE IMAGE ============
    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;  // Store Base64 image string
    
    // ============ SCHOOL INFORMATION ============
    @Column(name = "student_id")
    private String studentId;
    
    @Column(name = "year_level")
    private String yearLevel;
    
    @Column(name = "course_strand")
    private String course;
    
    @Column(name = "date_of_birth")
    private String dateOfBirth;
    
    @Column(name = "school_year")
    private String schoolYear;
    
    // ============ ROOM INFORMATION ============
    @Column(name = "room_building")
    private String roomBuilding;
    
    @Column(name = "room_number")
    private String roomNumber;
    
    @Column(name = "special_delivery")
    private String specialDelivery;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    // Default constructor
    public User() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Constructor with required fields
    public User(String fullName, String email, String password) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = "CUSTOMER";
        this.isActive = true;
        this.isVerified = false;
        this.createdAt = LocalDateTime.now();
        this.country = "Philippines";
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    // Profile Image Getter/Setter
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    
    // School Information Getters/Setters
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
    
    // Room Information Getters/Setters
    public String getRoomBuilding() { return roomBuilding; }
    public void setRoomBuilding(String roomBuilding) { this.roomBuilding = roomBuilding; }
    
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    
    public String getSpecialDelivery() { return specialDelivery; }
    public void setSpecialDelivery(String specialDelivery) { this.specialDelivery = specialDelivery; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
}