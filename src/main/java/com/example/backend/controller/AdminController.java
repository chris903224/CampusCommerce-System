package com.example.backend.controller;

import com.example.backend.model.Order;
import com.example.backend.model.User;
import com.example.backend.model.Product;
import com.example.backend.model.AdminFace;
import com.example.backend.dto.UserResponse;
import com.example.backend.repository.AdminFaceRepository;
import com.example.backend.service.OrderService;
import com.example.backend.service.UserService;
import com.example.backend.service.ProductService;
import com.example.backend.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:8080"})
public class AdminController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private OtpService otpService;
    
    @Autowired
    private AdminFaceRepository adminFaceRepository;
    
    private static final String ADMIN_PASSWORD = "Admin@2026";
    private static final String ADMIN_EMAIL = "suppliessjc@gmail.com";
    
    private Map<String, String> adminSessions = new ConcurrentHashMap<>();
    private Map<String, Object> systemSettings = new ConcurrentHashMap<>();
    
    // ============= AUTHENTICATION =============
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String password = request.get("password");
            
            if (ADMIN_PASSWORD.equals(password)) {
                String sessionId = "ADMIN_SESS_" + System.currentTimeMillis();
                adminSessions.put(sessionId, ADMIN_EMAIL);
                
                boolean otpSent = otpService.sendOtp(ADMIN_EMAIL);
                
                if (otpSent) {
                    response.put("success", true);
                    response.put("message", "Password verified. OTP sent to your email.");
                    response.put("requiresOtp", true);
                    response.put("sessionId", sessionId);
                } else {
                    response.put("success", false);
                    response.put("message", "Failed to send OTP");
                }
                
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Invalid admin password");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sessionId = request.get("sessionId");
            String otp = request.get("otp");
            
            String email = adminSessions.get(sessionId);
            
            if (email != null && otpService.verifyOtp(email, otp)) {
                String token = "ADMIN_TOKEN_" + System.currentTimeMillis();
                adminSessions.remove(sessionId);
                
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("token", token);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Invalid OTP");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out");
        return ResponseEntity.ok(response);
    }
    
    // ============= DASHBOARD STATS =============
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            List<Order> allOrders = orderService.getAllOrders();
            List<Order> pendingPayments = orderService.getPendingPayments();
            
            stats.put("totalUsers", userService.getTotalUsers());
            stats.put("totalOrders", allOrders.size());
            stats.put("pendingPayments", pendingPayments.size());
            
            double revenue = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()) || "DELIVERED".equals(o.getStatus()))
                .mapToDouble(Order::getTotal)
                .sum();
            stats.put("totalRevenue", revenue);
            
            stats.put("lowStockProducts", productService.getLowStockCount());
            
            List<Order> recentOrders = allOrders.stream().limit(5).toList();
            stats.put("recentOrders", recentOrders);
            
            List<User> recentUsers = userService.getRecentUsers(5);
            stats.put("recentUsers", recentUsers);
            
            // Sales chart data
            Map<String, Object> salesChart = new HashMap<>();
            List<String> labels = Arrays.asList("Jan", "Feb", "Mar", "Apr", "May", "Jun");
            List<Double> data = new ArrayList<>();
            
            if (allOrders.isEmpty()) {
                data = Arrays.asList(5000.0, 8000.0, 12000.0, 9000.0, 15000.0, 18000.0);
            } else {
                Random rand = new Random();
                for (int i = 0; i < 6; i++) {
                    data.add(5000.0 + rand.nextInt(15000));
                }
            }
            
            salesChart.put("labels", labels);
            salesChart.put("data", data);
            stats.put("salesChart", salesChart);
            
            // Order status distribution
            Map<String, Long> statusDistribution = new HashMap<>();
            if (allOrders.isEmpty()) {
                statusDistribution.put("pending", 3L);
                statusDistribution.put("processing", 2L);
                statusDistribution.put("shipped", 1L);
                statusDistribution.put("completed", 4L);
                statusDistribution.put("cancelled", 1L);
            } else {
                statusDistribution.put("pending", allOrders.stream().filter(o -> "PENDING".equals(o.getStatus())).count());
                statusDistribution.put("processing", allOrders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count());
                statusDistribution.put("shipped", allOrders.stream().filter(o -> "SHIPPED".equals(o.getStatus())).count());
                statusDistribution.put("completed", allOrders.stream().filter(o -> "COMPLETED".equals(o.getStatus())).count());
                statusDistribution.put("cancelled", allOrders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count());
            }
            
            stats.put("orderStatus", statusDistribution);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= USER MANAGEMENT =============
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) String search) {
        try {
            List<UserResponse> users;
            
            if (search != null && !search.isEmpty()) {
                List<User> userList = userService.searchUsers(search);
                users = userService.convertToUserResponseList(userList);
            } else {
                List<User> userList = userService.getAllUsers();
                users = userService.convertToUserResponseList(userList);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            response.put("count", users.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userService.getUserById(userId);
            
            if (userOpt.isPresent()) {
                UserResponse userResponse = userService.convertToUserResponse(userOpt.get());
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("user", userResponse);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUserProfile(userId, userDetails);
            UserResponse response = userService.convertToUserResponse(updatedUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "User updated successfully");
            result.put("user", response);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            User user = userService.updateUserStatus(userId, status);
            
            if (user != null) {
                UserResponse response = userService.convertToUserResponse(user);
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "User status updated");
                result.put("user", response);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            boolean deleted = userService.deleteUser(userId);
            if (deleted) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "User deleted");
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= PRODUCT MANAGEMENT =============
    
    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        try {
            List<Product> products = productService.getAllProducts();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("products", products);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductById(@PathVariable Long productId) {
        try {
            Product product = productService.getProductById(productId);
            if (product != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("product", product);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Product not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        try {
            Product created = productService.createProduct(product);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product created");
            response.put("product", created);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/products/{productId}")
    public ResponseEntity<?> updateProduct(@PathVariable Long productId, @RequestBody Product product) {
        try {
            Product updated = productService.updateProduct(productId, product);
            if (updated != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Product updated");
                response.put("product", updated);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Product not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long productId) {
        try {
            boolean deleted = productService.deleteProduct(productId);
            if (deleted) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Product deleted");
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Product not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/products/low-stock")
    public ResponseEntity<?> getLowStockProducts() {
        try {
            List<Product> lowStockProducts = productService.getLowStockProducts();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("products", lowStockProducts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= ORDER MANAGEMENT =============
    
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(@RequestParam(required = false) String status) {
        try {
            List<Order> orders;
            if (status != null && !status.isEmpty() && !"all".equals(status)) {
                orders = orderService.getOrdersByStatus(status.toUpperCase());
            } else {
                orders = orderService.getAllOrders();
            }
            
            // Force load items for each order
            for (Order order : orders) {
                if (order.getItems() != null) {
                    order.getItems().size();
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orders", orders);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);
            if (order != null) {
                // Force load items to avoid lazy initialization
                if (order.getItems() != null) {
                    order.getItems().size();
                }
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("order", order);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            System.out.println("📝 Updating order " + orderId + " to status: " + status);
            
            Order order = orderService.updateStatus(orderId, status);
            
            if (order != null) {
                if (order.getItems() != null) {
                    order.getItems().size();
                }
                System.out.println("✅ Order " + orderId + " status updated to: " + order.getStatus());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Status updated to " + status);
                response.put("order", order);
                return ResponseEntity.ok(response);
            } else {
                System.out.println("❌ Order not found: " + orderId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/orders/{orderId}/tracking")
    public ResponseEntity<?> updateOrderTracking(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            String trackingNumber = request.get("trackingNumber");
            if (trackingNumber == null || trackingNumber.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Tracking number is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Order order = orderService.updateTrackingNumber(orderId, trackingNumber);
            
            if (order != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Tracking number updated successfully");
                response.put("trackingNumber", order.getTrackingNumber());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/orders/{orderId}/estimated-delivery")
    public ResponseEntity<?> updateEstimatedDelivery(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            String estimatedDelivery = request.get("estimatedDelivery");
            String deliveryNotes = request.get("deliveryNotes");
            
            System.out.println("📝 Updating estimated delivery for order " + orderId);
            System.out.println("   Estimated Delivery: " + estimatedDelivery);
            System.out.println("   Delivery Notes: " + deliveryNotes);
            
            if (estimatedDelivery == null || estimatedDelivery.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Estimated delivery date is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Order order = orderService.updateEstimatedDelivery(orderId, estimatedDelivery, deliveryNotes);
            
            if (order != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Estimated delivery date updated successfully");
                response.put("estimatedDelivery", order.getEstimatedDelivery());
                response.put("deliveryStatus", order.getDeliveryStatus());
                response.put("deliveryNotes", order.getDeliveryNotes());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/orders/{orderId}/delivery-status")
    public ResponseEntity<?> getDeliveryStatus(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);
            if (order != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("orderId", order.getId());
                response.put("orderNumber", order.getOrderNumber());
                response.put("trackingNumber", order.getTrackingNumber());
                response.put("estimatedDelivery", order.getEstimatedDelivery());
                response.put("deliveryStatus", order.getDeliveryStatus());
                response.put("deliveryNotes", order.getDeliveryNotes());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= PAYMENT VERIFICATION =============
    
    @GetMapping("/orders/pending-payments")
    public ResponseEntity<?> getPendingPayments() {
        try {
            List<Order> pendingOrders = orderService.getOrdersByStatus("PENDING");
            List<Order> waitingOrders = orderService.getOrdersByStatus("WAITING_PAYMENT_CONFIRMATION");
            
            Set<Order> allPending = new HashSet<>();
            allPending.addAll(pendingOrders);
            allPending.addAll(waitingOrders);
            
            List<Order> result = allPending.stream()
                .filter(o -> (o.getPaymentProof() != null && !o.getPaymentProof().isEmpty()) ||
                            (o.getPaymentReceipt() != null && !o.getPaymentReceipt().isEmpty()))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orders", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/orders/{orderId}/verify")
    public ResponseEntity<?> verifyPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            String action = request.get("action");
            String notes = request.get("notes");
            
            Order order = orderService.getOrderById(orderId);
            if (order == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            if ("approve".equals(action)) {
                order.setStatus("PROCESSING");
                order.setPaymentDate(LocalDateTime.now());
                order.setDeliveryStatus("PROCESSING");
                System.out.println("✅ Payment approved for order: " + orderId);
            } else if ("reject".equals(action)) {
                order.setStatus("CANCELLED");
                order.setCancelledDate(LocalDateTime.now());
                order.setDeliveryStatus("CANCELLED");
                System.out.println("❌ Payment rejected for order: " + orderId);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid action");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (notes != null && !notes.isEmpty()) {
                order.setDeliveryNotes(notes);
            }
            
            Order updatedOrder = orderService.updateOrder(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment " + action + "d successfully");
            response.put("order", updatedOrder);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/orders/{orderId}/fraud")
    public ResponseEntity<?> markAsFraud(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);
            if (order == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Order not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            order.setStatus("FRAUD");
            order.setDeliveryNotes("Marked as fraudulent payment");
            Order updatedOrder = orderService.updateOrder(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Order marked as fraudulent");
            response.put("order", updatedOrder);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= REPORTS & ANALYTICS =============
    
    @GetMapping("/reports/sales")
    public ResponseEntity<?> getSalesReport(@RequestParam String period) {
        try {
            Map<String, Object> report = new HashMap<>();
            List<Order> allOrders = orderService.getAllOrders();
            
            double totalSales = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()) || "DELIVERED".equals(o.getStatus()))
                .mapToDouble(Order::getTotal)
                .sum();
            
            report.put("totalSales", totalSales);
            report.put("totalOrders", allOrders.size());
            
            double avgOrderValue = allOrders.isEmpty() ? 0 : 
                allOrders.stream().mapToDouble(Order::getTotal).average().orElse(0);
            report.put("averageOrderValue", avgOrderValue);
            
            List<Map<String, Object>> topProducts = new ArrayList<>();
            if (!allOrders.isEmpty()) {
                Map<String, Double> productSales = new HashMap<>();
                
                for (Order order : allOrders) {
                    if (order.getItems() != null) {
                        order.getItems().forEach(item -> {
                            String productName = item.getProductName();
                            double itemTotal = item.getPrice() * item.getQuantity();
                            productSales.merge(productName, itemTotal, Double::sum);
                        });
                    }
                }
                
                productSales.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .limit(5)
                    .forEach(entry -> {
                        Map<String, Object> product = new HashMap<>();
                        product.put("name", entry.getKey());
                        product.put("sales", entry.getValue());
                        topProducts.add(product);
                    });
            } else {
                Map<String, Object> product1 = new HashMap<>();
                product1.put("name", "Bond Paper");
                product1.put("sales", 12500.0);
                topProducts.add(product1);
                
                Map<String, Object> product2 = new HashMap<>();
                product2.put("name", "Gel Pens");
                product2.put("sales", 8900.0);
                topProducts.add(product2);
                
                Map<String, Object> product3 = new HashMap<>();
                product3.put("name", "Colored Pencils");
                product3.put("sales", 7600.0);
                topProducts.add(product3);
                
                Map<String, Object> product4 = new HashMap<>();
                product4.put("name", "Notebooks");
                product4.put("sales", 5400.0);
                topProducts.add(product4);
                
                Map<String, Object> product5 = new HashMap<>();
                product5.put("name", "Folders");
                product5.put("sales", 3200.0);
                topProducts.add(product5);
            }
            
            report.put("topProducts", topProducts);
            
            List<Map<String, Object>> monthlyData = new ArrayList<>();
            String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
            double[] values = {5200, 6800, 8900, 7500, 10200, 12800};
            
            for (int i = 0; i < months.length; i++) {
                Map<String, Object> month = new HashMap<>();
                month.put("month", months[i]);
                month.put("value", values[i]);
                monthlyData.add(month);
            }
            
            report.put("monthlyData", monthlyData);
            report.put("conversionRate", 68.5);
            
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/reports/export")
    public ResponseEntity<?> exportReport(
            @RequestParam String format,
            @RequestParam String period) {
        try {
            List<Order> orders = orderService.getAllOrders();
            
            StringBuilder csv = new StringBuilder();
            csv.append("Order ID,Date,Total,Status,Payment Method,Tracking Number,Estimated Delivery\n");
            
            if (orders.isEmpty()) {
                csv.append("ORD-001,2026-03-01,5200.00,COMPLETED,GCash,TRK001,2026-03-05\n");
                csv.append("ORD-002,2026-03-03,3800.00,COMPLETED,GCash,TRK002,2026-03-07\n");
                csv.append("ORD-003,2026-03-05,12500.00,PROCESSING,Manual,TRK003,2026-03-10\n");
                csv.append("ORD-004,2026-03-07,8900.00,PENDING,QR,,2026-03-12\n");
                csv.append("ORD-005,2026-03-09,7600.00,COMPLETED,COD,TRK005,2026-03-14\n");
            } else {
                for (Order order : orders) {
                    csv.append(order.getId()).append(",")
                       .append(order.getOrderDate()).append(",")
                       .append(order.getTotal()).append(",")
                       .append(order.getStatus()).append(",")
                       .append(order.getPaymentMethod()).append(",")
                       .append(order.getTrackingNumber() != null ? order.getTrackingNumber() : "").append(",")
                       .append(order.getEstimatedDelivery() != null ? order.getEstimatedDelivery() : "").append("\n");
                }
            }
            
            byte[] data = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales-report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
                
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= NOTIFICATIONS =============
    
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        try {
            List<Map<String, Object>> notifications = new ArrayList<>();
            
            List<Order> pendingPayments = orderService.getPendingPayments();
            if (!pendingPayments.isEmpty()) {
                Map<String, Object> notif = new HashMap<>();
                notif.put("id", "payment_" + System.currentTimeMillis());
                notif.put("type", "payment");
                notif.put("title", "Pending Payments");
                notif.put("message", pendingPayments.size() + " payments awaiting verification");
                notif.put("createdAt", new Date());
                notif.put("read", false);
                notifications.add(notif);
            }
            
            long lowStock = productService.getLowStockCount();
            if (lowStock > 0) {
                Map<String, Object> notif = new HashMap<>();
                notif.put("id", "stock_" + System.currentTimeMillis());
                notif.put("type", "product");
                notif.put("title", "Low Stock Alert");
                notif.put("message", lowStock + " products are running low");
                notif.put("createdAt", new Date());
                notif.put("read", false);
                notifications.add(notif);
            }
            
            if (notifications.isEmpty()) {
                Map<String, Object> notif = new HashMap<>();
                notif.put("id", "welcome_" + System.currentTimeMillis());
                notif.put("type", "info");
                notif.put("title", "Welcome to Admin Dashboard");
                notif.put("message", "Manage your store efficiently");
                notif.put("createdAt", new Date());
                notif.put("read", false);
                notifications.add(notif);
            }
            
            return ResponseEntity.ok(notifications);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
    
    // ============= SYSTEM SETTINGS =============
    
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            if (systemSettings.isEmpty()) {
                systemSettings.put("storeName", "EduSupplies");
                systemSettings.put("storeEmail", "contact@edusupplies.com");
                systemSettings.put("storePhone", "+63 912 345 6789");
                systemSettings.put("storeAddress", "123 Education St, Manila");
                systemSettings.put("currency", "PHP");
                systemSettings.put("dashboardBackground", "default");
                systemSettings.put("gcashEnabled", true);
                systemSettings.put("qrEnabled", true);
                systemSettings.put("codEnabled", true);
                systemSettings.put("gcashNumber", "09123456789");
                systemSettings.put("shippingFee", 50.0);
                systemSettings.put("freeShippingThreshold", 500.0);
                systemSettings.put("deliveryDays", 3);
                systemSettings.put("emailNotifications", true);
                systemSettings.put("orderConfirmation", true);
                systemSettings.put("paymentReceived", true);
                systemSettings.put("shippingUpdate", true);
                systemSettings.put("twoFactorEnabled", false);
                systemSettings.put("loginAttemptsEnabled", true);
                systemSettings.put("sessionTimeout", 480);
            }
            
            return ResponseEntity.ok(systemSettings);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> settings) {
        try {
            systemSettings.putAll(settings);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Settings updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/settings/reset")
    public ResponseEntity<?> resetSettings() {
        try {
            systemSettings.clear();
            systemSettings.put("storeName", "EduSupplies");
            systemSettings.put("storeEmail", "contact@edusupplies.com");
            systemSettings.put("storePhone", "+63 912 345 6789");
            systemSettings.put("storeAddress", "123 Education St, Manila");
            systemSettings.put("currency", "PHP");
            systemSettings.put("dashboardBackground", "default");
            systemSettings.put("gcashEnabled", true);
            systemSettings.put("qrEnabled", true);
            systemSettings.put("codEnabled", true);
            systemSettings.put("gcashNumber", "09123456789");
            systemSettings.put("shippingFee", 50.0);
            systemSettings.put("freeShippingThreshold", 500.0);
            systemSettings.put("deliveryDays", 3);
            systemSettings.put("emailNotifications", true);
            systemSettings.put("orderConfirmation", true);
            systemSettings.put("paymentReceived", true);
            systemSettings.put("shippingUpdate", true);
            systemSettings.put("twoFactorEnabled", false);
            systemSettings.put("loginAttemptsEnabled", true);
            systemSettings.put("sessionTimeout", 480);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Settings reset successfully");
            response.put("settings", systemSettings);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // ============= FACE RECOGNITION ENDPOINTS =============
    
    private double[] parseFaceDescriptor(String descriptorJson) {
        try {
            String cleaned = descriptorJson.replace("[", "").replace("]", "");
            String[] parts = cleaned.split(",");
            double[] descriptor = new double[parts.length];
            for (int i = 0; i < parts.length; i++) {
                descriptor[i] = Double.parseDouble(parts[i].trim());
            }
            return descriptor;
        } catch (Exception e) {
            System.err.println("Failed to parse face descriptor: " + e.getMessage());
            return null;
        }
    }
    
    private double calculateEuclideanDistance(double[] desc1, double[] desc2) {
        if (desc1 == null || desc2 == null || desc1.length != desc2.length) {
            return Double.MAX_VALUE;
        }
        
        double sum = 0.0;
        for (int i = 0; i < desc1.length; i++) {
            double diff = desc1[i] - desc2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    
    @PostMapping("/face/register")
    public ResponseEntity<?> registerAdminFace(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String faceDescriptorJson = (String) request.get("faceDescriptor");
            String adminEmail = ADMIN_EMAIL;
            
            if (faceDescriptorJson == null || faceDescriptorJson.isEmpty()) {
                response.put("success", false);
                response.put("message", "Face descriptor is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            double[] descriptor = parseFaceDescriptor(faceDescriptorJson);
            if (descriptor == null) {
                response.put("success", false);
                response.put("message", "Invalid face descriptor format");
                return ResponseEntity.badRequest().body(response);
            }
            
            AdminFace newFace = new AdminFace(adminEmail, faceDescriptorJson, LocalDateTime.now());
            adminFaceRepository.save(newFace);
            
            long sampleCount = adminFaceRepository.countByAdminEmail(adminEmail);
            
            response.put("success", true);
            response.put("message", sampleCount > 1 ? "Another admin face sample added successfully" : "Admin face registered successfully");
            response.put("registered", true);
            response.put("sampleCount", sampleCount);
            response.put("faceId", newFace.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/face/verify")
    public ResponseEntity<?> verifyAdminFace(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String faceDescriptorJson = (String) request.get("faceDescriptor");
            
            if (faceDescriptorJson == null || faceDescriptorJson.isEmpty()) {
                response.put("success", false);
                response.put("message", "Face descriptor is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            double[] inputDescriptor = parseFaceDescriptor(faceDescriptorJson);
            if (inputDescriptor == null) {
                response.put("success", false);
                response.put("message", "Invalid face descriptor format");
                return ResponseEntity.badRequest().body(response);
            }
            
            List<AdminFace> storedFaces = adminFaceRepository.findAllByAdminEmailOrderByRegisteredAtDesc(ADMIN_EMAIL);
            
            if (storedFaces.isEmpty()) {
                response.put("success", false);
                response.put("firstTime", true);
                response.put("message", "No registered face found. Please register first.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            double bestDistance = Double.MAX_VALUE;
            AdminFace bestMatch = null;
            int validSamples = 0;
            
            for (AdminFace face : storedFaces) {
                double[] registeredDescriptor = parseFaceDescriptor(face.getFaceDescriptor());
                if (registeredDescriptor == null) {
                    continue;
                }
                
                validSamples++;
                double distance = calculateEuclideanDistance(registeredDescriptor, inputDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = face;
                }
            }
            
            if (validSamples == 0 || bestMatch == null) {
                response.put("success", false);
                response.put("message", "No valid registered face samples found. Please register again.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
            double threshold = 0.45;
            
            System.out.println("🔍 Face Verification Result:");
            System.out.println("   Samples checked: " + validSamples);
            System.out.println("   Best distance: " + bestDistance);
            System.out.println("   Threshold: " + threshold);
            System.out.println("   Match: " + (bestDistance < threshold ? "YES ✅" : "NO ❌"));
            
            boolean isMatch = bestDistance < threshold;
            long sampleCount = storedFaces.size();
            
            if (isMatch) {
                bestMatch.setLastVerifiedAt(LocalDateTime.now());
                adminFaceRepository.save(bestMatch);
                
                String adminToken = "ADMIN_FACE_" + System.currentTimeMillis();
                double confidence = Math.max(0, (1 - bestDistance) * 100);
                
                response.put("success", true);
                response.put("message", String.format("Face verified successfully (confidence: %.2f%%)", confidence));
                response.put("token", adminToken);
                response.put("confidence", confidence);
                response.put("sampleCount", sampleCount);
                response.put("matchedSampleId", bestMatch.getId());
                response.put("redirect", "/admin-dashboard.html");
                return ResponseEntity.ok(response);
            } else {
                double confidence = Math.max(0, (1 - bestDistance) * 100);
                response.put("success", false);
                response.put("message", String.format("Face not recognized. Access denied. (Match confidence: %.2f%%)", confidence));
                response.put("confidence", confidence);
                response.put("sampleCount", sampleCount);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/face/status")
    public ResponseEntity<?> getFaceRegistrationStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<AdminFace> existingFaces = adminFaceRepository.findAllByAdminEmailOrderByRegisteredAtDesc(ADMIN_EMAIL);
            boolean isRegistered = !existingFaces.isEmpty();
            
            response.put("success", true);
            response.put("registered", isRegistered);
            response.put("sampleCount", existingFaces.size());
            response.put("message", isRegistered ? "Face samples are registered" : "Face not registered yet");
            
            if (isRegistered) {
                response.put("registeredAt", existingFaces.get(0).getRegisteredAt());
                
                LocalDateTime lastVerifiedAt = existingFaces.stream()
                    .map(AdminFace::getLastVerifiedAt)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
                
                if (lastVerifiedAt != null) {
                    response.put("lastVerifiedAt", lastVerifiedAt);
                }
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @DeleteMapping("/face/clear")
    public ResponseEntity<?> clearRegisteredFace() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            adminFaceRepository.deleteAllByAdminEmail(ADMIN_EMAIL);
            
            systemSettings.remove("adminFaceDescriptor");
            systemSettings.put("faceRegistered", false);
            
            response.put("success", true);
            response.put("message", "Registered face samples cleared successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
