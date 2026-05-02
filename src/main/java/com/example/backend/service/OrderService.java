package com.example.backend.service;

import com.example.backend.model.Order;
import com.example.backend.model.OrderItem;
import com.example.backend.model.Product;
import com.example.backend.model.User;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;  // ADD THIS - IMPORTANT!
    
    // ===== USER SIDE =====
    
    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        for (Order order : orders) {
            if (order.getItems() != null) {
                order.getItems().size(); // Force load items
            }
        }
        return orders;
    }
    
    @Transactional(readOnly = true)
    public Order getOrderDetails(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId).orElse(null);
        if (order != null && order.getItems() != null) {
            order.getItems().size();
        }
        return order;
    }
    
    // ===== CREATE ORDER (UPDATED WITH USER INFO) =====
    
    @Transactional
    @SuppressWarnings("unchecked")
    public Order createOrder(Long userId, Double total, String paymentMethod,
                             String paymentReceipt, List<?> items,
                             String roomBuilding, String roomNumber, 
                             String specialDelivery, String gcashReference, 
                             String senderName, String paymentProof) {
        
        try {
            System.out.println("📝 Creating order for user: " + userId);
            System.out.println("   Payment Method: " + paymentMethod);
            System.out.println("   Has Payment Proof: " + (paymentProof != null && !paymentProof.isEmpty()));
            
            // ============= GET USER INFORMATION =============
            User user = null;
            String studentId = "";
            String yearLevel = "";
            String course = "";
            String schoolYear = "";
            String schoolEmail = "";
            String userPhone = "";
            String userFullName = "";
            String userEmailAddress = "";
            String userRoomBuilding = "";
            String userRoomNumber = "";
            String userSpecialDelivery = "";
            
            try {
                user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    userFullName = user.getFullName();
                    userEmailAddress = user.getEmail();
                    userPhone = user.getPhone() != null ? user.getPhone() : "";
                    studentId = user.getStudentId() != null ? user.getStudentId() : "";
                    yearLevel = user.getYearLevel() != null ? user.getYearLevel() : "";
                    course = user.getCourse() != null ? user.getCourse() : "";
                    schoolYear = user.getSchoolYear() != null ? user.getSchoolYear() : "";
                    schoolEmail = user.getEmail(); // Use email as school email
                    userRoomBuilding = user.getRoomBuilding() != null ? user.getRoomBuilding() : "";
                    userRoomNumber = user.getRoomNumber() != null ? user.getRoomNumber() : "";
                    userSpecialDelivery = user.getSpecialDelivery() != null ? user.getSpecialDelivery() : "";
                    
                    System.out.println("   ✅ User found: " + userFullName);
                    System.out.println("   📚 Student ID: " + studentId);
                    System.out.println("   📖 Year Level: " + yearLevel);
                    System.out.println("   🎓 Course: " + course);
                    System.out.println("   📅 School Year: " + schoolYear);
                    System.out.println("   📧 School Email: " + schoolEmail);
                    System.out.println("   📱 Phone: " + userPhone);
                    System.out.println("   🏠 Room: " + userRoomBuilding + " " + userRoomNumber);
                } else {
                    System.out.println("⚠️ User not found with ID: " + userId);
                }
            } catch (Exception e) {
                System.out.println("⚠️ Could not fetch user details: " + e.getMessage());
            }
            
            // Check stock availability
            for (Object obj : items) {
                if (obj instanceof Map) {
                    Map<String, Object> itemMap = (Map<String, Object>) obj;
                    Long productId = Long.parseLong(itemMap.get("productId").toString());
                    String sizeName = (String) itemMap.get("size");
                    int quantity = Integer.parseInt(itemMap.get("quantity").toString());
                    
                    Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                    
                    Optional<Product.Size> sizeOpt = product.getSizes().stream()
                        .filter(s -> s.getName().equals(sizeName))
                        .findFirst();
                    
                    if (sizeOpt.isEmpty()) {
                        throw new RuntimeException("Size " + sizeName + " not available for product: " + product.getName());
                    }
                    
                    Product.Size size = sizeOpt.get();
                    Integer currentStock = size.getStock() != null ? size.getStock() : 0;
                    
                    if (currentStock < quantity) {
                        throw new RuntimeException("Insufficient stock for " + product.getName() + 
                            " (" + sizeName + "). Available: " + currentStock + ", Requested: " + quantity);
                    }
                }
            }
            
            // Create order
            Order order = new Order();
            order.setUserId(userId);
            order.setTotal(total != null ? total : 0.0);
            
            // Set status based on payment method
            if ("GCash QR".equals(paymentMethod)) {
                if (paymentProof != null && !paymentProof.isEmpty()) {
                    order.setStatus("WAITING_PAYMENT_CONFIRMATION");
                } else {
                    order.setStatus("PENDING");
                }
            } else {
                order.setStatus("PENDING");
            }
            
            order.setPaymentMethod(paymentMethod != null ? paymentMethod : "");
            order.setPaymentReceipt(paymentReceipt);
            order.setOrderDate(LocalDateTime.now());
            
            // Save payment proof for GCash QR
            if (paymentProof != null && !paymentProof.isEmpty()) {
                order.setPaymentProof(paymentProof);
                System.out.println("   Payment proof saved (length: " + paymentProof.length() + " chars)");
            }
            
            // ============= SET USER INFORMATION IN ORDER =============
            // Customer basic info
            order.setCustomerName(userFullName != null && !userFullName.isEmpty() ? userFullName : senderName);
            order.setUserEmail(userEmailAddress != null && !userEmailAddress.isEmpty() ? userEmailAddress : "customer@example.com");
            order.setUserPhone(userPhone);
            
            // SCHOOL INFORMATION (CRITICAL FOR ADMIN)
            order.setStudentId(studentId);
            order.setYearLevel(yearLevel);
            order.setCourse(course);
            order.setSchoolYear(schoolYear);
            order.setSchoolEmail(schoolEmail);
            
            // ROOM / DELIVERY INFORMATION
            // Use user's saved info if provided, otherwise use what was passed from frontend
            order.setRoomBuilding(roomBuilding != null && !roomBuilding.isEmpty() ? roomBuilding : userRoomBuilding);
            order.setRoomNumber(roomNumber != null && !roomNumber.isEmpty() ? roomNumber : userRoomNumber);
            order.setSpecialDelivery(specialDelivery != null && !specialDelivery.isEmpty() ? specialDelivery : userSpecialDelivery);
            
            // Additional fields
            order.setGcashReference(gcashReference != null ? gcashReference : "");
            order.setSenderName(senderName != null ? senderName : "");
            
            // Payment type
            if (paymentMethod != null) {
                if (paymentMethod.contains("QR")) {
                    order.setPaymentType("QR");
                } else if (paymentMethod.contains("Manual")) {
                    order.setPaymentType("MANUAL");
                } else if (paymentMethod.contains("Cash")) {
                    order.setPaymentType("COD");
                }
            }
            
            // Initial delivery status
            order.setDeliveryStatus("PENDING");
            
            // Deduct stock and create order items
            double calculatedTotal = 0.0;
            
            if (items != null) {
                for (Object obj : items) {
                    if (obj instanceof Map) {
                        Map<String, Object> itemMap = (Map<String, Object>) obj;
                        
                        Long productId = Long.parseLong(itemMap.get("productId").toString());
                        String sizeName = (String) itemMap.get("size");
                        int quantity = Integer.parseInt(itemMap.get("quantity").toString());
                        double price = Double.parseDouble(itemMap.get("price").toString());
                        
                        calculatedTotal += price * quantity;
                        
                        Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                        
                        // Update stock
                        for (Product.Size size : product.getSizes()) {
                            if (size.getName().equals(sizeName)) {
                                Integer oldStock = size.getStock() != null ? size.getStock() : 0;
                                Integer newStock = oldStock - quantity;
                                size.setStock(newStock);
                                System.out.println("   Stock updated: " + product.getName() + " (" + sizeName + ") " + oldStock + " -> " + newStock);
                                break;
                            }
                        }
                        
                        // Update product availability
                        boolean anyStock = product.getSizes().stream()
                            .anyMatch(s -> {
                                Integer stock = s.getStock();
                                return stock != null && stock > 0;
                            });
                        
                        product.setInStock(anyStock);
                        productRepository.save(product);
                        
                        // Create order item
                        OrderItem item = new OrderItem();
                        item.setProductId(productId);
                        item.setProductName((String) itemMap.get("productName"));
                        item.setProductIcon((String) itemMap.get("productIcon"));
                        item.setSize(sizeName);
                        item.setPrice(price);
                        item.setQuantity(quantity);
                        item.setSubtotal(price * quantity);
                        item.setOrder(order);
                        order.getItems().add(item);
                    }
                }
            }
            
            // Use calculated total if not provided
            if (total == null || total == 0) {
                order.setTotal(calculatedTotal);
            }
            
            Order savedOrder = orderRepository.save(order);
            savedOrder.generateOrderNumberFromId();
            savedOrder = orderRepository.save(savedOrder);
            
            System.out.println("🎉 Order created successfully!");
            System.out.println("   Order ID: " + savedOrder.getId());
            System.out.println("   Order Number: " + savedOrder.getOrderNumber());
            System.out.println("   Status: " + savedOrder.getStatus());
            System.out.println("   Total: ₱" + savedOrder.getTotal());
            System.out.println("   Student ID saved: " + savedOrder.getStudentId());
            System.out.println("   Year Level saved: " + savedOrder.getYearLevel());
            System.out.println("   Course saved: " + savedOrder.getCourse());
            
            return savedOrder;
            
        } catch (Exception e) {
            System.out.println("❌ Error creating order: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create order: " + e.getMessage(), e);
        }
    }
    
    // ===== CANCEL ORDER =====
    
    @Transactional
    public boolean cancelOrder(Long userId, Long orderId) {
        try {
            Order order = orderRepository.findByIdAndUserId(orderId, userId).orElse(null);
            if (order != null && ("PENDING".equals(order.getStatus()) || 
                                   "PROCESSING".equals(order.getStatus()) ||
                                   "WAITING_PAYMENT_CONFIRMATION".equals(order.getStatus()))) {
                
                // Restore stock
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        Product product = productRepository.findById(item.getProductId()).orElse(null);
                        if (product != null && product.getSizes() != null) {
                            for (Product.Size size : product.getSizes()) {
                                if (size.getName().equals(item.getSize())) {
                                    Integer currentStock = size.getStock() != null ? size.getStock() : 0;
                                    size.setStock(currentStock + item.getQuantity());
                                    break;
                                }
                            }
                            productRepository.save(product);
                        }
                    }
                }
                
                order.setStatus("CANCELLED");
                order.setCancelledDate(LocalDateTime.now());
                orderRepository.save(order);
                
                System.out.println("✅ Order " + orderId + " cancelled successfully");
                return true;
            }
            System.out.println("⚠️ Cannot cancel order " + orderId + ". Current status: " + (order != null ? order.getStatus() : "not found"));
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error cancelling order: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    // ===== UPDATE PAYMENT PROOF =====
    
    @Transactional
    public Order updatePaymentProof(Long orderId, String paymentProof) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
            
            order.setPaymentProof(paymentProof);
            order.setStatus("WAITING_PAYMENT_CONFIRMATION");
            
            System.out.println("📸 Payment proof updated for order: " + orderId);
            
            return orderRepository.save(order);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to update payment proof: " + e.getMessage());
            throw e;
        }
    }
    
    // ===== CONFIRM PAYMENT (Admin) =====
    
    @Transactional
    public Order confirmPayment(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
            
            if (!"WAITING_PAYMENT_CONFIRMATION".equals(order.getStatus())) {
                throw new RuntimeException("Order is not waiting for payment confirmation. Current status: " + order.getStatus());
            }
            
            order.setStatus("PROCESSING");
            order.setPaymentDate(LocalDateTime.now());
            order.setDeliveryStatus("PROCESSING");
            
            System.out.println("✅ Payment confirmed for order: " + orderId);
            
            return orderRepository.save(order);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to confirm payment: " + e.getMessage());
            throw e;
        }
    }
    
    // ===== UPDATE TRACKING NUMBER =====
    
    @Transactional
    public Order updateTrackingNumber(Long orderId, String trackingNumber) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
            
            order.setTrackingNumber(trackingNumber);
            System.out.println("📦 Tracking number updated for order " + orderId + ": " + trackingNumber);
            
            return orderRepository.save(order);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to update tracking number: " + e.getMessage());
            throw e;
        }
    }
    
    // ===== UPDATE ESTIMATED DELIVERY =====
    
    @Transactional
    public Order updateEstimatedDelivery(Long orderId, String estimatedDelivery, String deliveryNotes) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
            
            if (estimatedDelivery != null && !estimatedDelivery.isEmpty()) {
                order.setEstimatedDelivery(estimatedDelivery);
                System.out.println("📅 Estimated delivery date updated for order " + orderId + ": " + estimatedDelivery);
            }
            
            if (deliveryNotes != null) {
                order.setDeliveryNotes(deliveryNotes);
                System.out.println("📝 Delivery notes updated for order " + orderId + ": " + deliveryNotes);
            }
            
            // Update delivery status based on estimated delivery
            updateDeliveryStatus(order);
            
            return orderRepository.save(order);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to update estimated delivery: " + e.getMessage());
            throw e;
        }
    }
    
    private void updateDeliveryStatus(Order order) {
        String estimatedDelivery = order.getEstimatedDelivery();
        
        if (estimatedDelivery == null || estimatedDelivery.isEmpty()) {
            order.setDeliveryStatus("PENDING");
            return;
        }
        
        try {
            LocalDate estimatedDate = LocalDate.parse(estimatedDelivery);
            LocalDate today = LocalDate.now();
            
            if (estimatedDate.isBefore(today)) {
                order.setDeliveryStatus("DELIVERED");
                if (!"CANCELLED".equals(order.getStatus())) {
                    order.setStatus("DELIVERED");
                }
            } else if (estimatedDate.equals(today)) {
                order.setDeliveryStatus("OUT_FOR_DELIVERY");
            } else {
                order.setDeliveryStatus("IN_TRANSIT");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not parse estimated delivery date: " + estimatedDelivery);
            order.setDeliveryStatus("PENDING");
        }
    }
    
    // ===== UPDATE ORDER STATUS =====
    
    @Transactional
    public Order updateStatus(Long orderId, String status) {
        try {
            System.out.println("📝 updateStatus called for order " + orderId + " to " + status);
            
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                System.out.println("❌ Order not found: " + orderId);
                return null;
            }
            
            System.out.println("   Current status: " + order.getStatus());
            
            // Force load items to avoid lazy initialization
            if (order.getItems() != null) {
                order.getItems().size();
            }
            
            order.setStatus(status);
            
            // Update delivery status based on order status
            if ("COMPLETED".equals(status) || "DELIVERED".equals(status)) {
                order.setDeliveryStatus("DELIVERED");
            } else if ("SHIPPED".equals(status)) {
                order.setDeliveryStatus("IN_TRANSIT");
            }
            
            Order savedOrder = orderRepository.save(order);
            System.out.println("✅ Order " + orderId + " status updated to: " + savedOrder.getStatus());
            
            return savedOrder;
            
        } catch (Exception e) {
            System.err.println("❌ Error updating order status: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update order status: " + e.getMessage());
        }
    }
    
    @Transactional
    public Order updateOrder(Order order) {
        return orderRepository.save(order);
    }
    
    // ===== GET ORDERS =====
    
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        for (Order order : orders) {
            if (order.getItems() != null) {
                order.getItems().size();
            }
        }
        return orders;
    }
    
    @Transactional(readOnly = true)
    public List<Order> getOrdersByStatus(String status) {
        List<Order> orders = orderRepository.findByStatusOrderByOrderDateDesc(status);
        for (Order order : orders) {
            if (order.getItems() != null) {
                order.getItems().size();
            }
        }
        return orders;
    }
    
    @Transactional(readOnly = true)
    public List<Order> getPendingPayments() {
        List<Order> orders = orderRepository.findByStatusAndPaymentReceiptIsNotNull("PENDING");
        for (Order order : orders) {
            if (order.getItems() != null) {
                order.getItems().size();
            }
        }
        return orders;
    }
    
    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null && order.getItems() != null) {
            order.getItems().size();
        }
        return order;
    }
    
    @Transactional(readOnly = true)
    public Order getPendingOrderByUserId(Long userId) {
        try {
            List<Order> orders = orderRepository.findByUserIdAndStatusOrderByOrderDateDesc(userId, "PENDING");
            if (orders.isEmpty()) {
                orders = orderRepository.findByUserIdAndStatusOrderByOrderDateDesc(userId, "WAITING_PAYMENT_CONFIRMATION");
            }
            return orders.isEmpty() ? null : orders.get(0);
        } catch (Exception e) {
            System.err.println("⚠️ Error getting pending order: " + e.getMessage());
            return null;
        }
    }
    
    @Transactional(readOnly = true)
    public String getPaymentStatus(Long orderId) {
        Order order = getOrderById(orderId);
        if (order == null) {
            return "NOT_FOUND";
        }
        
        String status = order.getStatus();
        if ("PENDING".equals(status) || "WAITING_PAYMENT_CONFIRMATION".equals(status)) {
            return "PENDING";
        } else if ("PROCESSING".equals(status) || "SHIPPED".equals(status)) {
            return "PROCESSING";
        } else if ("COMPLETED".equals(status) || "DELIVERED".equals(status)) {
            return "COMPLETED";
        } else if ("CANCELLED".equals(status)) {
            return "CANCELLED";
        }
        return status;
    }
    
    // ===== STATISTICS =====
    
    @Transactional(readOnly = true)
    public double getTotalSales() {
        try {
            List<Order> completedOrders = orderRepository.findByStatusIn(List.of("COMPLETED", "DELIVERED"));
            return completedOrders.stream()
                .mapToDouble(Order::getTotal)
                .sum();
        } catch (Exception e) {
            System.err.println("⚠️ Error calculating total sales: " + e.getMessage());
            return 0.0;
        }
    }
    
    @Transactional(readOnly = true)
    public long getTotalOrdersCount() {
        try {
            return orderRepository.count();
        } catch (Exception e) {
            return 0L;
        }
    }
    
    @Transactional(readOnly = true)
    public long getPendingOrdersCount() {
        try {
            return orderRepository.countByStatusIn(List.of("PENDING", "WAITING_PAYMENT_CONFIRMATION"));
        } catch (Exception e) {
            // Fallback if countByStatusIn doesn't work
            long pending = 0;
            long waiting = 0;
            try {
                pending = orderRepository.countByStatus("PENDING");
            } catch (Exception ex) {}
            try {
                waiting = orderRepository.countByStatus("WAITING_PAYMENT_CONFIRMATION");
            } catch (Exception ex) {}
            return pending + waiting;
        }
    }
    
    @Transactional(readOnly = true)
    public long getCompletedOrdersCount() {
        try {
            return orderRepository.countByStatusIn(List.of("COMPLETED", "DELIVERED"));
        } catch (Exception e) {
            // Fallback if countByStatusIn doesn't work
            long completed = 0;
            long delivered = 0;
            try {
                completed = orderRepository.countByStatus("COMPLETED");
            } catch (Exception ex) {}
            try {
                delivered = orderRepository.countByStatus("DELIVERED");
            } catch (Exception ex) {}
            return completed + delivered;
        }
    }
}