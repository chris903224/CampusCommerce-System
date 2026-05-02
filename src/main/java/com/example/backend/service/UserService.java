package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.model.OtpVerification;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.OtpRepository;
import com.example.backend.dto.LoginResponse;
import com.example.backend.dto.UserResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder; // ✅ Import ito
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OtpRepository otpRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder; // ✅ AUTO WIRED
    
    private ConcurrentHashMap<String, Long> activeTokens = new ConcurrentHashMap<>();
    private Random random = new Random();
    
    private String generateOtp() {
        return String.format("%06d", random.nextInt(1000000));
    }
    
    @Transactional
    public LoginResponse register(String fullName, String email, String password) {
        // Check if email exists
        if (userRepository.existsByEmail(email)) {
            return new LoginResponse(false, "Email already exists", null, null, null, null, null, false, false);
        }
        
        try {
            // ✅ DAPAT NAKA-ENCODE NA ITO (galing sa controller)
            User user = new User(fullName, email, password);
            User savedUser = userRepository.save(user);
            
            // Generate and save OTP
            String otp = generateOtp();
            OtpVerification otpVerification = new OtpVerification(email, otp, 5);
            otpRepository.save(otpVerification);
            
            // Send OTP email
            try {
                emailService.sendOtpEmail(email, otp);
            } catch (Exception e) {
                System.out.println("⚠️ Email sending failed: " + e.getMessage());
            }
            
            String token = UUID.randomUUID().toString();
            activeTokens.put(token, savedUser.getId());
            
            return new LoginResponse(true, "Registration successful. Please verify your email.", 
                savedUser.getId(), savedUser.getFullName(), savedUser.getEmail(), 
                savedUser.getRole(), token, true, false);
            
        } catch (Exception e) {
            return new LoginResponse(false, "Registration failed: " + e.getMessage(), 
                null, null, null, null, null, false, false);
        }
    }
    
    @Transactional
    public LoginResponse login(String email, String rawPassword) {
        System.out.println("🔍 Login attempt for: " + email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            System.out.println("✅ User found: " + user.getEmail());
            
            if (!user.isVerified()) {
                // Generate and send new OTP
                String otp = generateOtp();
                otpRepository.deleteByEmail(email);
                OtpVerification otpVerification = new OtpVerification(email, otp, 5);
                otpRepository.save(otpVerification);
                
                try {
                    emailService.sendOtpEmail(email, otp);
                } catch (Exception e) {
                    System.out.println("⚠️ Email sending failed: " + e.getMessage());
                }
                
                return new LoginResponse(false, "Please verify your email first", 
                    user.getId(), user.getFullName(), user.getEmail(), 
                    user.getRole(), null, true, false);
            }
            
            // ✅ FIX: Use passwordEncoder.matches() instead of .equals()
            boolean passwordMatches = passwordEncoder.matches(rawPassword, user.getPassword());
            System.out.println("🔐 Password matches: " + passwordMatches);
            
            if (passwordMatches) {
                String token = UUID.randomUUID().toString();
                activeTokens.put(token, user.getId());
                user.setLastLogin(java.time.LocalDateTime.now());
                userRepository.save(user);
                
                return new LoginResponse(true, "Login successful", 
                    user.getId(), user.getFullName(), user.getEmail(), 
                    user.getRole(), token, false, true);
            } else {
                return new LoginResponse(false, "Invalid password", 
                    null, null, null, null, null, false, false);
            }
        } else {
            return new LoginResponse(false, "User not found", 
                null, null, null, null, null, false, false);
        }
    }
    
    @Transactional
    public boolean verifyOtp(String email, String otp) {
        Optional<OtpVerification> otpOpt = otpRepository.findByEmailAndOtp(email, otp);
        
        if (otpOpt.isPresent()) {
            OtpVerification otpVerification = otpOpt.get();
            
            if (otpVerification.isExpired()) {
                return false;
            }
            
            if (otpVerification.isVerified()) {
                return false;
            }
            
            otpVerification.setVerified(true);
            otpRepository.save(otpVerification);
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerified(true);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }
    
    @Transactional
    public boolean resendOtp(String email) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return false;
            }
            
            String otp = generateOtp();
            otpRepository.deleteByEmail(email);
            OtpVerification otpVerification = new OtpVerification(email, otp, 5);
            otpRepository.save(otpVerification);
            emailService.sendOtpEmail(email, otp);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    public void logout(String token) {
        if (token != null && !token.isEmpty()) {
            activeTokens.remove(token);
        }
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateUserProfile(Long userId, User updatedUser) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Personal Info
        if (updatedUser.getFullName() != null) 
            user.setFullName(updatedUser.getFullName());
        if (updatedUser.getEmail() != null) 
            user.setEmail(updatedUser.getEmail());
        if (updatedUser.getPhone() != null) 
            user.setPhone(updatedUser.getPhone());
        if (updatedUser.getDateOfBirth() != null) 
            user.setDateOfBirth(updatedUser.getDateOfBirth());
        
        // School Info
        if (updatedUser.getStudentId() != null) 
            user.setStudentId(updatedUser.getStudentId());
        if (updatedUser.getYearLevel() != null) 
            user.setYearLevel(updatedUser.getYearLevel());
        if (updatedUser.getCourse() != null) 
            user.setCourse(updatedUser.getCourse());
        if (updatedUser.getSchoolYear() != null) 
            user.setSchoolYear(updatedUser.getSchoolYear());
        
        // Room Info
        if (updatedUser.getRoomBuilding() != null) 
            user.setRoomBuilding(updatedUser.getRoomBuilding());
        if (updatedUser.getRoomNumber() != null) 
            user.setRoomNumber(updatedUser.getRoomNumber());
        if (updatedUser.getSpecialDelivery() != null) 
            user.setSpecialDelivery(updatedUser.getSpecialDelivery());
        
        // Address
        if (updatedUser.getAddress() != null) 
            user.setAddress(updatedUser.getAddress());
        if (updatedUser.getCity() != null) 
            user.setCity(updatedUser.getCity());
        if (updatedUser.getPostalCode() != null) 
            user.setPostalCode(updatedUser.getPostalCode());
        if (updatedUser.getCountry() != null) 
            user.setCountry(updatedUser.getCountry());
        
        return userRepository.save(user);
    }
    
    @Transactional
    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // ✅ FIX: Use matches() for current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }
        
        // ✅ FIX: Encode new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }
    
    // ============ ADMIN METHODS ============
    
    public long getTotalUsers() {
        return userRepository.count();
    }
    
    public List<User> getRecentUsers(int limit) {
        return userRepository.findTop5ByOrderByIdDesc();
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> searchUsers(String keyword) {
        return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword);
    }
    
    @Transactional
    public User updateUserStatus(Long userId, String status) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if ("ACTIVE".equalsIgnoreCase(status)) {
                user.setIsActive(true);
            } else if ("INACTIVE".equalsIgnoreCase(status)) {
                user.setIsActive(false);
            }
            return userRepository.save(user);
        }
        return null;
    }
    
    @Transactional
    public boolean deleteUser(Long userId) {
        if (userRepository.existsById(userId)) {
            userRepository.deleteById(userId);
            return true;
        }
        return false;
    }
    
    public UserResponse convertToUserResponse(User user) {
        return new UserResponse(user);
    }
    
    public List<UserResponse> convertToUserResponseList(List<User> users) {
        return users.stream()
            .map(this::convertToUserResponse)
            .collect(Collectors.toList());
    }
}