package com.example.backend.service;

import com.example.backend.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private CartService cartService;
    
    public Map<String, Object> getUserStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Get orders as Order objects (not Map)
            List<Order> orders = orderService.getUserOrders(userId);
            List<Map<String, Object>> cart = cartService.getCart(userId);
            
            int totalOrders = orders.size();
            int pendingOrders = 0;
            int completedOrders = 0;
            double totalSpent = 0.0;
            
            for (Order order : orders) {  // ← Order object, hindi Map
                String status = order.getStatus();  // ← Use getter, not get()
                Double orderTotal = order.getTotal();
                
                if (orderTotal != null) {
                    totalSpent += orderTotal;
                }
                
                if ("PENDING".equalsIgnoreCase(status)) {
                    pendingOrders++;
                } else if ("COMPLETED".equalsIgnoreCase(status) || "DELIVERED".equalsIgnoreCase(status)) {
                    completedOrders++;
                }
            }
            
            stats.put("totalOrders", totalOrders);
            stats.put("pendingOrders", pendingOrders);
            stats.put("completedOrders", completedOrders);
            stats.put("totalSpent", totalSpent);
            stats.put("cartItemsCount", cart.size());
            
            double cartTotal = 0.0;
            for (var item : cart) {
                Object totalObj = item.get("total");
                if (totalObj instanceof Number) {
                    cartTotal += ((Number) totalObj).doubleValue();
                }
            }
            stats.put("cartTotal", cartTotal);
            
        } catch (Exception e) {
            e.printStackTrace();
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    // ===== ADD THESE FOR ADMIN DASHBOARD =====
    
    public Map<String, Object> getSalesChartData(int days) {
        Map<String, Object> chartData = new HashMap<>();
        List<Order> allOrders = orderService.getAllOrders();
        
        // Sample data structure
        List<String> labels = List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
        List<Double> data = List.of(1200.0, 1600.0, 900.0, 1800.0, 1400.0, 1700.0, 1000.0);
        
        chartData.put("labels", labels);
        chartData.put("data", data);
        
        return chartData;
    }
    
    public Map<String, Long> getOrderStatusDistribution() {
        Map<String, Long> distribution = new HashMap<>();
        List<Order> allOrders = orderService.getAllOrders();
        
        long pending = allOrders.stream().filter(o -> "PENDING".equals(o.getStatus())).count();
        long processing = allOrders.stream().filter(o -> "PROCESSING".equals(o.getStatus())).count();
        long completed = allOrders.stream().filter(o -> "COMPLETED".equals(o.getStatus())).count();
        long cancelled = allOrders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count();
        
        distribution.put("pending", pending);
        distribution.put("processing", processing);
        distribution.put("completed", completed);
        distribution.put("cancelled", cancelled);
        
        return distribution;
    }
}