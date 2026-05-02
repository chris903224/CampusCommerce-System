package com.example.backend.repository;

import com.example.backend.model.AdminSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AdminSessionRepository extends JpaRepository<AdminSession, Long> {
    
    /**
     * Find admin session by token
     */
    Optional<AdminSession> findByToken(String token);
    
    /**
     * Delete admin session by token
     */
    @Transactional
    @Modifying
    void deleteByToken(String token);
    
    /**
     * Delete all expired sessions
     */
    @Transactional
    @Modifying
    void deleteByExpiresAtBefore(LocalDateTime date);
    
    /**
     * Check if token exists and is valid (not expired)
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM AdminSession s WHERE s.token = :token AND s.expiresAt > :now")
    boolean existsByTokenAndExpiresAtAfter(@Param("token") String token, @Param("now") LocalDateTime now);
    
    /**
     * Find session by email (for debugging)
     */
    Optional<AdminSession> findByEmail(String email);
    
    /**
     * Delete all sessions for a specific email
     */
    @Transactional
    @Modifying
    void deleteByEmail(String email);
}