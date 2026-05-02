package com.example.backend.repository;

import com.example.backend.model.AdminFace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminFaceRepository extends JpaRepository<AdminFace, Long> {
    Optional<AdminFace> findByAdminEmail(String adminEmail);

    java.util.List<AdminFace> findAllByAdminEmailOrderByRegisteredAtDesc(String adminEmail);

    long countByAdminEmail(String adminEmail);

    void deleteAllByAdminEmail(String adminEmail);
}
