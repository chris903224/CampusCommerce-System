package com.example.backend.controller;

import com.example.backend.dto.CartItemRequest;
import com.example.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartService cartService;
    
    @GetMapping
    public Map<String, Object> getCart(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var cart = cartService.getCart(userId);
            System.out.println("📤 Getting cart for user " + userId + ": " + cart.size() + " items");
            
            double total = 0.0;
            for (var item : cart) {
                total += (double) item.getOrDefault("total", 0.0);
            }
            
            response.put("success", true);
            response.put("cart", cart);
            response.put("count", cart.size());
            response.put("total", total);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @GetMapping("/count")
    public Map<String, Object> getCartCount(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var cart = cartService.getCart(userId);
            response.put("success", true);
            response.put("count", cart.size());
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("count", 0);
        }
        
        return response;
    }
    
    @GetMapping("/total")
    public Map<String, Object> getCartTotal(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var cart = cartService.getCart(userId);
            double total = 0.0;
            for (var item : cart) {
                total += (double) item.getOrDefault("total", 0.0);
            }
            
            response.put("success", true);
            response.put("total", total);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("total", 0.0);
        }
        
        return response;
    }
    
    @PostMapping("/add")
    public Map<String, Object> addToCart(@RequestBody CartItemRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("🛒 Adding to cart - User: " + request.getUserId() + 
                             ", Product: " + request.getProductName() + 
                             " (ID: " + request.getProductId() + ")");
            
            var item = cartService.addToCart(
                request.getUserId(),
                request.getProductId(),
                request.getProductName(),
                request.getProductIcon(),
                request.getSize(),
                request.getPrice(),
                request.getQuantity()
            );
            
            response.put("success", true);
            response.put("message", "Item added to cart");
            response.put("cartItem", item);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @PutMapping("/update/{itemId}")
    public Map<String, Object> updateCartItem(
            @RequestParam Long userId,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean updated = cartService.updateCartItem(userId, itemId, quantity);
            
            if (updated) {
                response.put("success", true);
                response.put("message", "Cart updated");
            } else {
                response.put("success", false);
                response.put("message", "Item not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @DeleteMapping("/remove/{itemId}")
    public Map<String, Object> removeFromCart(
            @RequestParam Long userId,
            @PathVariable Long itemId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean removed = cartService.removeFromCart(userId, itemId);
            
            if (removed) {
                response.put("success", true);
                response.put("message", "Item removed");
            } else {
                response.put("success", false);
                response.put("message", "Item not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @DeleteMapping("/clear")
    public Map<String, Object> clearCart(@RequestParam Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cartService.clearCart(userId);
            response.put("success", true);
            response.put("message", "Cart cleared");
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
}