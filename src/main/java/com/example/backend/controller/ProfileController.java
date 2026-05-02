package com.example.backend.controller;

import com.example.backend.dto.PasswordChangeRequest;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public ProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    // CHANGE PASSWORD ENDPOINT
    @PostMapping("/{userId}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long userId,
            @RequestBody PasswordChangeRequest request,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📥 Change password request for user ID: " + userId);
            
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(404).body(response);
            }
            
            User user = userOpt.get();
            
            // Check current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                response.put("success", false);
                response.put("message", "Current password is incorrect");
                return ResponseEntity.status(401).body(response);
            }
            
            // Check if new password matches confirm password
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                response.put("success", false);
                response.put("message", "New passwords do not match");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate new password strength
            String newPassword = request.getNewPassword();
            if (newPassword.length() < 8) {
                response.put("success", false);
                response.put("message", "Password must be at least 8 characters");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!newPassword.matches(".*[A-Z].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one uppercase letter");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!newPassword.matches(".*[0-9].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one number");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!newPassword.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one special character");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            System.out.println("✅ Password changed successfully for user: " + user.getEmail());
            
            response.put("success", true);
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to change password: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Get profile
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        
        User user = userOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        profile.put("dateOfBirth", user.getDateOfBirth());
        profile.put("studentId", user.getStudentId());
        profile.put("schoolYear", user.getSchoolYear());
        profile.put("yearLevel", user.getYearLevel());
        profile.put("course", user.getCourse());
        profile.put("roomBuilding", user.getRoomBuilding());
        profile.put("roomNumber", user.getRoomNumber());
        profile.put("specialDelivery", user.getSpecialDelivery());
        profile.put("profileImage", user.getProfileImage());
        
        response.put("success", true);
        response.put("profile", profile);
        return ResponseEntity.ok(response);
    }
    
    // Update profile
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody Map<String, Object> profileData) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        
        User user = userOpt.get();
        
        if (profileData.containsKey("fullName")) user.setFullName((String) profileData.get("fullName"));
        if (profileData.containsKey("email")) user.setEmail((String) profileData.get("email"));
        if (profileData.containsKey("phone")) user.setPhone((String) profileData.get("phone"));
        if (profileData.containsKey("dateOfBirth")) user.setDateOfBirth((String) profileData.get("dateOfBirth"));
        if (profileData.containsKey("studentId")) user.setStudentId((String) profileData.get("studentId"));
        if (profileData.containsKey("schoolYear")) user.setSchoolYear((String) profileData.get("schoolYear"));
        if (profileData.containsKey("yearLevel")) user.setYearLevel((String) profileData.get("yearLevel"));
        if (profileData.containsKey("course")) user.setCourse((String) profileData.get("course"));
        if (profileData.containsKey("roomBuilding")) user.setRoomBuilding((String) profileData.get("roomBuilding"));
        if (profileData.containsKey("roomNumber")) user.setRoomNumber((String) profileData.get("roomNumber"));
        if (profileData.containsKey("specialDelivery")) user.setSpecialDelivery((String) profileData.get("specialDelivery"));
        if (profileData.containsKey("profileImage")) user.setProfileImage((String) profileData.get("profileImage"));
        
        userRepository.save(user);
        
        response.put("success", true);
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }
    
    // ============================================
    // ADD THESE NEW ENDPOINTS
    // ============================================
    
    // Update profile image only
    @PutMapping("/{userId}/profile-image")
    public ResponseEntity<?> updateProfileImage(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📥 Update profile image request for user ID: " + userId);
            
            String profileImage = request.get("profileImage");
            if (profileImage == null || profileImage.isEmpty()) {
                response.put("success", false);
                response.put("message", "No image provided");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(404).body(response);
            }
            
            User user = userOpt.get();
            user.setProfileImage(profileImage);
            userRepository.save(user);
            
            System.out.println("✅ Profile image updated for user: " + user.getEmail());
            
            response.put("success", true);
            response.put("message", "Profile image updated successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to update profile image: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Get profile image only
    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<?> getProfileImage(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        
        User user = userOpt.get();
        response.put("success", true);
        response.put("profileImage", user.getProfileImage());
        return ResponseEntity.ok(response);
    }
}