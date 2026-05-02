package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_number")
    private String orderNumber;
    
    @Column(name = "user_id")
    private Long userId;
    
    private Double total;
    private String status;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "payment_receipt", columnDefinition = "TEXT")
    private String paymentReceipt;
    
    @Column(name = "payment_proof", columnDefinition = "TEXT")
    private String paymentProof;
    
    @Column(name = "payment_type")
    private String paymentType;
    
    @Column(name = "payment_reference")
    private String paymentReference;
    
    @Column(name = "payment_date")
    private LocalDateTime paymentDate;
    
    @Column(name = "order_date")
    private LocalDateTime orderDate;
    
    @Column(name = "cancelled_date")
    private LocalDateTime cancelledDate;
    
    @Column(name = "room_building")
    private String roomBuilding;
    
    @Column(name = "room_number")
    private String roomNumber;
    
    @Column(name = "special_delivery")
    private String specialDelivery;
    
    @Column(name = "gcash_reference")
    private String gcashReference;
    
    @Column(name = "sender_name")
    private String senderName;
    
    @Column(name = "customer_name")
    private String customerName;
    
    @Column(name = "user_email")
    private String userEmail;
    
    // ============= SCHOOL INFORMATION FIELDS =============
    @Column(name = "student_id")
    private String studentId;
    
    @Column(name = "year_level")
    private String yearLevel;
    
    @Column(name = "course")
    private String course;
    
    @Column(name = "school_year")
    private String schoolYear;
    
    @Column(name = "school_email")
    private String schoolEmail;
    
    @Column(name = "user_phone")
    private String userPhone;
    
    // ============= TRACKING FIELDS =============
    @Column(name = "tracking_number")
    private String trackingNumber;
    
    @Column(name = "estimated_delivery")
    private String estimatedDelivery;
    
    @Column(name = "delivery_notes")
    private String deliveryNotes;
    
    @Column(name = "delivery_status")
    private String deliveryStatus;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();
    
    // Constructors
    public Order() {}
    
    public Order(Long userId, Double total, String status, String paymentMethod, LocalDateTime orderDate) {
        this.userId = userId;
        this.total = total;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.orderDate = orderDate;
    }
    
    // Generate order number from ID
    public void generateOrderNumberFromId() {
        if (this.id != null) {
            this.orderNumber = "SJC-" + String.format("%08d", this.id);
        }
    }
    
    // Helper method to copy user information to order
    public void copyUserInfo(User user) {
        if (user != null) {
            this.customerName = user.getFullName();
            this.userEmail = user.getEmail();
            this.userPhone = user.getPhone();
            this.studentId = user.getStudentId();
            this.yearLevel = user.getYearLevel();
            this.course = user.getCourse();
            this.schoolYear = user.getSchoolYear();
            this.schoolEmail = user.getEmail();
            this.roomBuilding = user.getRoomBuilding();
            this.roomNumber = user.getRoomNumber();
            this.specialDelivery = user.getSpecialDelivery();
        }
    }
    
    // ============= GETTERS AND SETTERS =============
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getPaymentReceipt() { return paymentReceipt; }
    public void setPaymentReceipt(String paymentReceipt) { this.paymentReceipt = paymentReceipt; }
    
    public String getPaymentProof() { return paymentProof; }
    public void setPaymentProof(String paymentProof) { this.paymentProof = paymentProof; }
    
    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
    
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
    
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    
    public LocalDateTime getCancelledDate() { return cancelledDate; }
    public void setCancelledDate(LocalDateTime cancelledDate) { this.cancelledDate = cancelledDate; }
    
    public String getRoomBuilding() { return roomBuilding; }
    public void setRoomBuilding(String roomBuilding) { this.roomBuilding = roomBuilding; }
    
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    
    public String getSpecialDelivery() { return specialDelivery; }
    public void setSpecialDelivery(String specialDelivery) { this.specialDelivery = specialDelivery; }
    
    public String getGcashReference() { return gcashReference; }
    public void setGcashReference(String gcashReference) { this.gcashReference = gcashReference; }
    
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    
    // School Info Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getYearLevel() { return yearLevel; }
    public void setYearLevel(String yearLevel) { this.yearLevel = yearLevel; }
    
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    
    public String getSchoolYear() { return schoolYear; }
    public void setSchoolYear(String schoolYear) { this.schoolYear = schoolYear; }
    
    public String getSchoolEmail() { return schoolEmail; }
    public void setSchoolEmail(String schoolEmail) { this.schoolEmail = schoolEmail; }
    
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    
    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
    
    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
    
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}