package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.PasswordChangeRequest;
import com.example.backend.model.OtpVerification;
import com.example.backend.model.User;
import com.example.backend.repository.OtpRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.EmailService;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    private final Random random = new Random();  
   
    private String generateOtp() {
        return String.format("%06d", random.nextInt(1000000));
    }
    
    @GetMapping("/test")
    public Map<String, Object> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Auth API is working!");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        System.out.println("📥 Login attempt: " + request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.getEmail().toLowerCase().trim();
            String password = request.getPassword();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return ResponseEntity.status(401).body(response);
            }
            
            User user = userOpt.get();
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return ResponseEntity.status(401).body(response);
            }
            
            // CREATE SESSION
            session.setAttribute("userId", user.getId());
            session.setAttribute("userEmail", user.getEmail());
            session.setAttribute("userRole", user.getRole());
            session.setAttribute("userName", user.getFullName());
            session.setMaxInactiveInterval(30 * 60);
            
            System.out.println("✅ Login successful for: " + email);
            System.out.println("📝 Session ID: " + session.getId());
            
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getFullName());
            response.put("role", user.getRole());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        System.out.println("📥 Register attempt: " + request.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (!request.getEmail().endsWith("@phinmaed.com")) {
                response.put("success", false);
                response.put("message", "Only @phinmaed.com email addresses are allowed");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Full name is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            String password = request.getPassword();
            if (password.length() < 8) {
                response.put("success", false);
                response.put("message", "Password must be at least 8 characters long");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!password.matches(".*[A-Z].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one uppercase letter");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!password.matches(".*[a-z].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one lowercase letter");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!password.matches(".*[0-9].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one number");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
                response.put("success", false);
                response.put("message", "Password must contain at least one special character");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
            if (existingUser.isPresent()) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.badRequest().body(response);
            }
            
            String encodedPassword = passwordEncoder.encode(request.getPassword());
            
            User newUser = new User();
            newUser.setFullName(request.getFullName().trim());
            newUser.setEmail(request.getEmail().toLowerCase().trim());
            newUser.setPassword(encodedPassword);
            newUser.setRole("USER");
            newUser.setVerified(false);
            userRepository.save(newUser);
            
            String otp = generateOtp();
            otpRepository.deleteByEmail(request.getEmail());
            
            OtpVerification otpVerification = new OtpVerification(
                request.getEmail().toLowerCase().trim(), otp, 5, "REGISTRATION");
            otpRepository.save(otpVerification);
            
            emailService.sendHtmlOtpEmail(request.getEmail().toLowerCase().trim(), otp, "Email Verification");
            
            response.put("success", true);
            response.put("message", "Registration successful! Please verify your email with the OTP sent.");
            response.put("requiresOtp", true);
            response.put("email", request.getEmail().toLowerCase().trim());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/send-otp")
    @Transactional
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String type = request.getOrDefault("type", "REGISTRATION");
            
            if (email == null || email.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            otpRepository.deleteByEmail(email);
            
            String otp = generateOtp();
            OtpVerification otpVerification = new OtpVerification(email, otp, 5, type);
            otpRepository.save(otpVerification);
            
            String purpose = type.equals("PASSWORD_RESET") ? "Password Reset" : "Email Verification";
            emailService.sendHtmlOtpEmail(email, otp, purpose);
            
            response.put("success", true);
            response.put("message", "OTP sent to your email (expires in 5 minutes)");
            response.put("email", email);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to send OTP: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/verify-otp")
    @Transactional
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            String type = request.getOrDefault("type", "REGISTRATION");
            
            if (email == null || otp == null) {
                response.put("success", false);
                response.put("message", "Email and OTP are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            
            OtpVerification otpVerification = otpRepository
                .findByEmailAndOtpAndType(email, otp, type).orElse(null);
            
            if (otpVerification == null) {
                response.put("success", false);
                response.put("message", "Invalid OTP");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (otpVerification.isExpired()) {
                response.put("success", false);
                response.put("message", "OTP has expired");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (otpVerification.isVerified()) {
                response.put("success", false);
                response.put("message", "OTP already used");
                return ResponseEntity.badRequest().body(response);
            }
            
            otpVerification.setVerified(true);
            otpRepository.save(otpVerification);
            
            if ("REGISTRATION".equals(type)) {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setVerified(true);
                    userRepository.save(user);
                    emailService.sendWelcomeEmail(email, user.getFullName());
                }
            }
            
            response.put("success", true);
            response.put("message", "OTP verified successfully!");
            response.put("email", email);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String type = request.getOrDefault("type", "REGISTRATION");
            
            if (email == null || email.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            otpRepository.deleteByEmail(email);
            
            String otp = generateOtp();
            OtpVerification otpVerification = new OtpVerification(email, otp, 5, type);
            otpRepository.save(otpVerification);
            
            String purpose = type.equals("PASSWORD_RESET") ? "Password Reset" : "Email Verification";
            emailService.sendHtmlOtpEmail(email, otp, purpose);
            
            response.put("success", true);
            response.put("message", "New OTP sent to your email");
            response.put("email", email);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to resend OTP: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Email not found in our records");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userOpt.get();
            otpRepository.deleteByEmailAndType(email, "PASSWORD_RESET");
            
            String otp = generateOtp();
            OtpVerification otpVerification = new OtpVerification(email, otp, 5, "PASSWORD_RESET");
            otpRepository.save(otpVerification);
            
            emailService.sendPasswordResetEmail(email, otp, user.getFullName());
            
            response.put("success", true);
            response.put("message", "Password reset OTP sent to your email");
            response.put("email", email);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to process request: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/verify-reset-otp")
    @Transactional
    public ResponseEntity<?> verifyResetOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            
            if (email == null || otp == null) {
                response.put("success", false);
                response.put("message", "Email and OTP are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            
            OtpVerification otpVerification = otpRepository
                .findByEmailAndOtpAndType(email, otp, "PASSWORD_RESET").orElse(null);
            
            if (otpVerification == null) {
                response.put("success", false);
                response.put("message", "Invalid OTP");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (otpVerification.isExpired()) {
                response.put("success", false);
                response.put("message", "OTP has expired");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (otpVerification.isVerified()) {
                response.put("success", false);
                response.put("message", "OTP already used");
                return ResponseEntity.badRequest().body(response);
            }
            
            otpVerification.setVerified(true);
            otpRepository.save(otpVerification);
            
            String resetToken = String.format("%012d", random.nextInt(1000000000));
            
            response.put("success", true);
            response.put("message", "OTP verified successfully");
            response.put("resetToken", resetToken);
            response.put("email", email);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");
            
            if (email == null || newPassword == null || confirmPassword == null) {
                response.put("success", false);
                response.put("message", "All fields are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            
            if (!newPassword.equals(confirmPassword)) {
                response.put("success", false);
                response.put("message", "Passwords do not match");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (newPassword.length() < 8) {
                response.put("success", false);
                response.put("message", "Password must be at least 8 characters");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            otpRepository.deleteByEmail(email);
            emailService.sendPasswordChangedEmail(email, user.getFullName());
            
            response.put("success", true);
            response.put("message", "Password reset successfully! You can now login with your new password.");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Password reset failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // ========== CHANGE PASSWORD USING USER ID (FIXED FOR FRONTEND) ==========
    @PostMapping("/profile/{userId}/change-password")
    @Transactional
    public ResponseEntity<?> changePasswordById(
            @PathVariable Long userId,
            @RequestBody PasswordChangeRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📥 Change password request for user ID: " + userId);
            
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
            response.put("message", "Password changed successfully!");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Password change failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // OLD change-password endpoint (kept for compatibility)
    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");
            
            if (email == null || oldPassword == null || newPassword == null || confirmPassword == null) {
                response.put("success", false);
                response.put("message", "All fields are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userOpt.get();
            
            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                response.put("success", false);
                response.put("message", "Current password is incorrect");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!newPassword.equals(confirmPassword)) {
                response.put("success", false);
                response.put("message", "New passwords do not match");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (newPassword.length() < 8) {
                response.put("success", false);
                response.put("message", "Password must be at least 8 characters");
                return ResponseEntity.badRequest().body(response);
            }
            
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            emailService.sendPasswordChangedEmail(email, user.getFullName());
            
            response.put("success", true);
            response.put("message", "Password changed successfully!");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Password change failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            email = email.toLowerCase().trim();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            response.put("success", true);
            response.put("exists", userOpt.isPresent());
            response.put("email", email);
            if (userOpt.isPresent()) response.put("verified", userOpt.get().isVerified());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Check failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // ========== PROFILE ENDPOINTS (for dashboard) ==========
    
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
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
            profile.put("phone", user.getPhone() != null ? user.getPhone() : "");
            profile.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth() : "");
            profile.put("studentId", user.getStudentId() != null ? user.getStudentId() : "");
            profile.put("schoolYear", user.getSchoolYear() != null ? user.getSchoolYear() : "");
            profile.put("yearLevel", user.getYearLevel() != null ? user.getYearLevel() : "");
            profile.put("course", user.getCourse() != null ? user.getCourse() : "");
            profile.put("roomBuilding", user.getRoomBuilding() != null ? user.getRoomBuilding() : "");
            profile.put("roomNumber", user.getRoomNumber() != null ? user.getRoomNumber() : "");
            profile.put("specialDelivery", user.getSpecialDelivery() != null ? user.getSpecialDelivery() : "");
            profile.put("profileImage", user.getProfileImage() != null ? user.getProfileImage() : "");
            
            response.put("success", true);
            response.put("profile", profile);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to load profile: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PutMapping("/profile/{userId}")
    @Transactional
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody Map<String, Object> profileData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
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
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PutMapping("/profile/{userId}/profile-image")
    @Transactional
    public ResponseEntity<?> updateProfileImage(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String profileImage = request.get("profileImage");
            if (profileImage == null) {
                response.put("success", false);
                response.put("message", "Profile image is required");
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
    
    // ========== SESSION MANAGEMENT ENDPOINTS ==========
    
    @GetMapping({"/user/check-session", "/check-session"})
    public ResponseEntity<?> checkSession(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        
        Long userId = (Long) session.getAttribute("userId");
        String userEmail = (String) session.getAttribute("userEmail");
        String userRole = (String) session.getAttribute("userRole");
        
        System.out.println("🔍 Session check - Session ID: " + session.getId());
        System.out.println("🔍 UserId: " + userId + ", Email: " + userEmail);
        
        if (userId != null && userEmail != null) {
            response.put("authenticated", true);
            response.put("userId", userId);
            response.put("email", userEmail);
            response.put("role", userRole);
            response.put("message", "Active session found");
            return ResponseEntity.ok(response);
        }
        
        response.put("authenticated", false);
        response.put("message", "No active session");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/session-info")
    public ResponseEntity<?> getSessionInfo(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", session.getAttribute("userId"));
        response.put("userEmail", session.getAttribute("userEmail"));
        response.put("userRole", session.getAttribute("userRole"));
        response.put("userName", session.getAttribute("userName"));
        response.put("sessionId", session.getId());
        response.put("creationTime", session.getCreationTime());
        response.put("maxInactiveInterval", session.getMaxInactiveInterval());
        response.put("isNew", session.isNew());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        System.out.println("📤 Logout called - Invalidating session: " + session.getId());
        session.invalidate();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }
}