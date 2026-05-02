package com.example.backend.service;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CartService {
    
    private Map<Long, List<Map<String, Object>>> userCarts = new ConcurrentHashMap<>();
    
    public List<Map<String, Object>> getCart(Long userId) {
        return userCarts.getOrDefault(userId, new ArrayList<>());
    }
    
    public Map<String, Object> addToCart(Long userId, Long productId, String productName,
                                         String productIcon, String size, Double price, Integer quantity) {
        
        System.out.println("📥 CartService.addToCart - User: " + userId + ", Product: " + productName);
        
        List<Map<String, Object>> cart = userCarts.computeIfAbsent(userId, k -> new ArrayList<>());
        
        // Check if item exists (same productId and size)
        for (Map<String, Object> item : cart) {
            if (item.get("productId").equals(productId) && item.get("size").equals(size)) {
                int newQty = (int) item.get("quantity") + quantity;
                item.put("quantity", newQty);
                item.put("total", price * newQty);
                System.out.println("✅ Updated existing item: " + productName + ", new qty: " + newQty);
                return item;
            }
        }
        
        // Add new item
        Map<String, Object> newItem = new HashMap<>();
        newItem.put("id", System.currentTimeMillis());
        newItem.put("userId", userId);
        newItem.put("productId", productId);
        newItem.put("productName", productName);
        newItem.put("productIcon", productIcon);
        newItem.put("size", size);
        newItem.put("price", price);
        newItem.put("quantity", quantity);
        newItem.put("total", price * quantity);
        
        cart.add(newItem);
        System.out.println("✅ Added new item to cart: " + productName + " (ID: " + productId + ")");
        
        return newItem;
    }
    
    public boolean removeFromCart(Long userId, Long itemId) {
        List<Map<String, Object>> cart = userCarts.get(userId);
        if (cart == null) return false;
        
        boolean removed = cart.removeIf(item -> item.get("id").equals(itemId));
        if (removed) {
            System.out.println("✅ Removed item from cart, ID: " + itemId);
        }
        return removed;
    }
    
    public boolean updateCartItem(Long userId, Long itemId, Integer quantity) {
        List<Map<String, Object>> cart = userCarts.get(userId);
        if (cart == null) return false;
        
        for (Map<String, Object> item : cart) {
            if (item.get("id").equals(itemId)) {
                double price = (double) item.get("price");
                item.put("quantity", quantity);
                item.put("total", price * quantity);
                System.out.println("✅ Updated cart item " + itemId + " to qty: " + quantity);
                return true;
            }
        }
        return false;
    }
    
    public void clearCart(Long userId) {
        userCarts.remove(userId);
        System.out.println("✅ Cleared cart for user: " + userId);
    }
}