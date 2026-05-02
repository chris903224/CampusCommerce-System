package com.example.backend.controller;

import com.example.backend.model.Product;
import com.example.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;
    
    @GetMapping
    public Map<String, Object> getAllProducts() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Now returns List<Product> instead of List<Map>
            List<Product> products = productService.getAllProducts();
            
            response.put("success", true);
            response.put("products", products);
            response.put("count", products.size());
            
            System.out.println("📦 Products fetched: " + products.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @GetMapping("/{id}")
    public Map<String, Object> getProductById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Now returns Product instead of Map
            Product product = productService.getProductById(id);
            
            if (product != null) {
                response.put("success", true);
                response.put("product", product);
                // Use proper getter, not get("name")
                System.out.println("📦 Product fetched: " + product.getName());
            } else {
                response.put("success", false);
                response.put("message", "Product not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    // Optional: Keep old method for backward compatibility if needed
    @GetMapping("/map")
    public Map<String, Object> getAllProductsAsMap() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var products = productService.getAllProductsAsMap();
            
            response.put("success", true);
            response.put("products", products);
            response.put("count", products.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
    
    @GetMapping("/map/{id}")
    public Map<String, Object> getProductByIdAsMap(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var product = productService.getProductByIdAsMap(id);
            
            if (product != null) {
                response.put("success", true);
                response.put("product", product);
            } else {
                response.put("success", false);
                response.put("message", "Product not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }
        
        return response;
    }
}