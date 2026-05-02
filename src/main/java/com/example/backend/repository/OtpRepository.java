package com.example.backend.repository;

import com.example.backend.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, Long> {
    
    Optional<OtpVerification> findByEmailAndOtp(String email, String otp);
    
    // ✅ ADD THIS - para mahanap by email, otp, at type
    Optional<OtpVerification> findByEmailAndOtpAndType(String email, String otp, String type);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.email = :email")
    void deleteByEmail(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.email = :email AND o.type = :type")
    void deleteByEmailAndType(@Param("email") String email, @Param("type") String type);
    
    boolean existsByEmailAndVerifiedFalse(String email);
}