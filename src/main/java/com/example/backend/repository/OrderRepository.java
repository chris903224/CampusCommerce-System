package com.example.backend.repository;

import com.example.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // ===== USER SIDE QUERIES =====
    
    /**
     * Get all orders for a specific user, sorted by date (newest first)
     */
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    
    /**
     * Get specific order for a specific user
     */
    Optional<Order> findByIdAndUserId(Long orderId, Long userId);
    
    /**
     * Get orders by user ID and status, sorted by date
     */
    List<Order> findByUserIdAndStatusOrderByOrderDateDesc(Long userId, String status);
    
    // ===== ADMIN SIDE QUERIES =====
    
    /**
     * Get all orders sorted by date (newest first)
     */
    List<Order> findAllByOrderByOrderDateDesc();
    
    /**
     * Get orders by status, sorted by date
     */
    List<Order> findByStatusOrderByOrderDateDesc(String status);
    
    /**
     * Get pending orders with payment receipts (for verification)
     */
    List<Order> findByStatusAndPaymentReceiptIsNotNull(String status);
    
    /**
     * Get recent orders (top 5) for dashboard
     */
    List<Order> findTop5ByOrderByOrderDateDesc();
    
    /**
     * Get orders by status in a list of statuses
     */
    List<Order> findByStatusIn(List<String> statuses);
    
    /**
     * Count orders by single status
     */
    long countByStatus(String status);
    
    /**
     * Count orders by multiple statuses
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<String> statuses);
    
    // ===== DATE RANGE QUERIES =====
    
    /**
     * Get orders between two dates
     */
    List<Order> findByOrderDateBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Get orders after a specific date with specific statuses
     */
    List<Order> findByOrderDateAfterAndStatusIn(LocalDateTime date, List<String> statuses);
    
    // ===== PAYMENT QUERIES =====
    
    /**
     * Get orders by payment method
     */
    List<Order> findByPaymentMethod(String paymentMethod);
    
    /**
     * Get orders with payment receipts (for GCash/QR payments)
     */
    List<Order> findByPaymentReceiptIsNotNull();
    
    /**
     * Get orders by specific order date
     */
    List<Order> findByOrderDate(LocalDateTime orderDate);
}