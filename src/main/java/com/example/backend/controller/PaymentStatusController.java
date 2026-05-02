package com.example.backend.controller;

import com.example.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentStatusController {
    
    @Autowired
    private OrderService orderService;
    
    // Check order payment status from database
    @GetMapping("/order/{orderId}/status")
    public ResponseEntity<?> getOrderPaymentStatus(@PathVariable Long orderId) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", orderService.getPaymentStatus(orderId));
        response.put("message", "Payment status retrieved");
        return ResponseEntity.ok(response);
    }
}