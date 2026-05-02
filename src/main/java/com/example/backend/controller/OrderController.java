package com.example.backend.controller;

import com.example.backend.dto.OrderRequest;
import com.example.backend.model.Order;
import com.example.backend.service.OrderService;
import com.example.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private CartService cartService;
    
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> convertItems(List<?> items) {
        List<Map<String, Object>> convertedItems = new ArrayList<>();
        if (items != null) {
            for (Object obj : items) {
                if (obj instanceof Map) {
                    convertedItems.add((Map<String, Object>) obj);
                }
            }
        }
        return convertedItems;
    }
    
    @GetMapping
    public Map<String, Object> getUserOrders(
            @RequestParam Long userId,
            @RequestParam(required = false) String status) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<Order> orders;
            if (status != null && !status.isEmpty()) {
                orders = orderService.getOrdersByStatus(status).stream()
                    .filter(o -> o.getUserId().equals(userId))
                    .toList();
            } else {
                orders = orderService.getUserOrders(userId);
            }
            
            response.put("success", true);
            response.put("orders", orders);
            response.put("count", orders.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error getting orders: " + e.getMessage());
        }
        return response;
    }
    
    @GetMapping("/{orderId}")
    public Map<String, Object> getOrderDetails(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long userId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Order order;
            if (userId != null) {
                order = orderService.getOrderDetails(userId, orderId);
            } else {
                order = orderService.getOrderById(orderId);
            }
            
            if (order != null) {
                response.put("success", true);
                response.put("order", order);
            } else {
                response.put("success", false);
                response.put("message", "Order not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
    
    @PostMapping("/checkout")
    @Transactional
    public Map<String, Object> checkout(@RequestBody OrderRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validations
            if (request.getUserId() == null) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return response;
            }
            
            if (request.getItems() == null || request.getItems().isEmpty()) {
                response.put("success", false);
                response.put("message", "Cart is empty");
                return response;
            }
            
            if (request.getPaymentMethod() == null || request.getPaymentMethod().isEmpty()) {
                response.put("success", false);
                response.put("message", "Payment method is required");
                return response;
            }
            
            // Room validation
            if (request.getRoomBuilding() == null || request.getRoomBuilding().isEmpty()) {
                response.put("success", false);
                response.put("message", "Building is required");
                return response;
            }
            
            if (request.getRoomNumber() == null || request.getRoomNumber().isEmpty()) {
                response.put("success", false);
                response.put("message", "Room Number is required");
                return response;
            }
            
            if (request.getSpecialDelivery() == null || request.getSpecialDelivery().isEmpty()) {
                response.put("success", false);
                response.put("message", "Special Delivery instruction is required");
                return response;
            }
            
            // Calculate total
            Double total = request.getTotal();
            if (total == null || total == 0) {
                total = 0.0;
                List<Map<String, Object>> items = convertItems(request.getItems());
                for (Map<String, Object> item : items) {
                    double price = Double.parseDouble(item.get("price").toString());
                    int quantity = Integer.parseInt(item.get("quantity").toString());
                    total += price * quantity;
                }
            }
            
            // Create order
            Order order = orderService.createOrder(
                request.getUserId(),
                total,
                request.getPaymentMethod(),
                request.getPaymentReceipt(),
                request.getItems(),
                request.getRoomBuilding(),
                request.getRoomNumber(),
                request.getSpecialDelivery(),
                request.getGcashReference(),
                request.getSenderName(),
                request.getPaymentProof()
            );
            
            // Clear cart
            cartService.clearCart(request.getUserId());
            
            response.put("success", true);
            response.put("message", "Order created successfully!");
            response.put("orderId", order.getId());
            response.put("order", order);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Checkout failed: " + e.getMessage());
        }
        return response;
    }
    
    @PutMapping("/{orderId}/cancel")
    public Map<String, Object> cancelOrder(
            @RequestParam Long userId,
            @PathVariable Long orderId) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean cancelled = orderService.cancelOrder(userId, orderId);
            
            if (cancelled) {
                response.put("success", true);
                response.put("message", "Order cancelled successfully");
            } else {
                response.put("success", false);
                response.put("message", "Cannot cancel order");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
    
    @GetMapping("/pending/{userId}")
    public Map<String, Object> getPendingOrder(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Order pendingOrder = orderService.getPendingOrderByUserId(userId);
            
            if (pendingOrder != null) {
                response.put("success", true);
                response.put("order", pendingOrder);
            } else {
                response.put("success", false);
                response.put("message", "No pending order");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        
        return response;
    }
    
    @PutMapping("/{orderId}/payment-proof")
    public Map<String, Object> updatePaymentProof(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            String paymentProof = request.get("paymentProof");
            if (paymentProof == null || paymentProof.isEmpty()) {
                response.put("success", false);
                response.put("message", "Payment proof is required");
                return response;
            }
            
            Order updatedOrder = orderService.updatePaymentProof(orderId, paymentProof);
            
            response.put("success", true);
            response.put("message", "Payment proof updated successfully");
            response.put("order", updatedOrder);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
    
    @PutMapping("/{orderId}/confirm-payment")
    public Map<String, Object> confirmPayment(@PathVariable Long orderId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Order updatedOrder = orderService.confirmPayment(orderId);
            
            response.put("success", true);
            response.put("message", "Payment confirmed successfully");
            response.put("order", updatedOrder);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
    
    @PutMapping("/{orderId}/tracking")
    public Map<String, Object> updateTrackingNumber(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            String trackingNumber = request.get("trackingNumber");
            if (trackingNumber == null || trackingNumber.isEmpty()) {
                response.put("success", false);
                response.put("message", "Tracking number is required");
                return response;
            }
            
            Order updatedOrder = orderService.updateTrackingNumber(orderId, trackingNumber);
            
            response.put("success", true);
            response.put("message", "Tracking number updated successfully");
            response.put("order", updatedOrder);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
    
    @PutMapping("/{orderId}/estimated-delivery")
    public Map<String, Object> updateEstimatedDelivery(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            String estimatedDelivery = request.get("estimatedDelivery");
            String deliveryNotes = request.get("deliveryNotes");
            
            if (estimatedDelivery == null || estimatedDelivery.isEmpty()) {
                response.put("success", false);
                response.put("message", "Estimated delivery date is required");
                return response;
            }
            
            Order updatedOrder = orderService.updateEstimatedDelivery(orderId, estimatedDelivery, deliveryNotes);
            
            response.put("success", true);
            response.put("message", "Estimated delivery date updated successfully");
            response.put("order", updatedOrder);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
}