package com.example.backend.service;

import com.example.backend.model.Order;
import com.example.backend.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PayMongoService {
    
    @Value("${paymongo.secret.key}")
    private String secretKey;
    
    @Value("${paymongo.public.key}")
    private String publicKey;
    
    @Autowired
    private OrderRepository orderRepository;
    
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private String getAuthHeader() {
        String auth = secretKey + ":";
        return "Basic " + java.util.Base64.getEncoder().encodeToString(auth.getBytes());
    }
    
    public Map<String, Object> createGCashPayment(Order order, String successUrl, String failedUrl) {
        try {
            String url = "https://api.paymongo.com/v1/sources";
            
            ObjectNode requestBody = objectMapper.createObjectNode();
            ObjectNode data = objectMapper.createObjectNode();
            ObjectNode attributes = objectMapper.createObjectNode();
            
            // Amount in centavos
            attributes.put("amount", (int)(order.getTotal() * 100));
            attributes.put("type", "gcash");
            attributes.put("currency", "PHP");
            
            // Redirect URLs
            attributes.put("redirect", objectMapper.createObjectNode()
                .put("success", successUrl != null ? successUrl : "https://unversed-unsettlingly-jackie.ngrok-free.dev/payment-success")
                .put("failed", failedUrl != null ? failedUrl : "https://unversed-unsettlingly-jackie.ngrok-free.dev/payment-failed"));
            
            // Billing info (null safe)
            ObjectNode billing = objectMapper.createObjectNode();
            billing.put("name", order.getSenderName() != null && !order.getSenderName().isEmpty() 
                ? order.getSenderName() : "Customer");
            billing.put("email", order.getUserEmail() != null && !order.getUserEmail().isEmpty() 
                ? order.getUserEmail() : "customer@example.com");
            attributes.set("billing", billing);
            
            // ✅ METADATA - NULL SAFE
            ObjectNode metadata = objectMapper.createObjectNode();
            metadata.put("order_id", order.getId() != null ? order.getId().toString() : "0");
            metadata.put("order_number", order.getOrderNumber() != null ? order.getOrderNumber() : "");
            metadata.put("room_building", order.getRoomBuilding() != null ? order.getRoomBuilding() : "");
            metadata.put("room_number", order.getRoomNumber() != null ? order.getRoomNumber() : "");
            metadata.put("special_delivery", order.getSpecialDelivery() != null ? order.getSpecialDelivery() : "");
            
            attributes.set("metadata", metadata);
            
            data.set("attributes", attributes);
            requestBody.set("data", data);
            
            // Log request for debugging
            String requestJson = objectMapper.writeValueAsString(requestBody);
            System.out.println("📤 PayMongo Request: " + requestJson);
            
            Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(requestJson, MediaType.parse("application/json")))
                .addHeader("Authorization", getAuthHeader())
                .addHeader("Content-Type", "application/json")
                .build();
            
            Response response = client.newCall(request).execute();
            String responseBody = response.body().string();
            
            System.out.println("📥 PayMongo Response: " + responseBody);
            
            if (response.isSuccessful()) {
                JsonNode json = objectMapper.readTree(responseBody);
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("sourceId", json.get("data").get("id").asText());
                result.put("qrCode", json.get("data").get("attributes").get("qr_code").asText());
                result.put("checkoutUrl", json.get("data").get("attributes").get("redirect").get("checkout_url").asText());
                result.put("amount", order.getTotal());
                
                System.out.println("✅ PayMongo payment created! Source ID: " + result.get("sourceId"));
                return result;
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", responseBody);
                System.err.println("❌ PayMongo API error: " + responseBody);
                return error;
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return error;
        }
    }
    
    public Map<String, Object> checkPaymentStatus(String sourceId) {
        try {
            String url = "https://api.paymongo.com/v1/sources/" + sourceId;
            
            Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("Authorization", getAuthHeader())
                .build();
            
            Response response = client.newCall(request).execute();
            String responseBody = response.body().string();
            
            if (response.isSuccessful()) {
                JsonNode json = objectMapper.readTree(responseBody);
                String status = json.get("data").get("attributes").get("status").asText();
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("status", status);
                result.put("paid", "chargeable".equals(status) || "paid".equals(status));
                
                System.out.println("📊 Payment status for " + sourceId + ": " + status);
                return result;
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("paid", false);
        return result;
    }
    
    @Transactional
    public Map<String, Object> handleWebhook(Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📥 Webhook received: " + payload);
            
            String eventType = (String) payload.get("type");
            
            if ("source.chargeable".equals(eventType)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
                String sourceId = (String) attributes.get("id");
                
                // Get metadata
                Map<String, Object> metadata = (Map<String, Object>) attributes.get("metadata");
                Long orderId = Long.parseLong(metadata.get("order_id").toString());
                
                // Update order status
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    order.setStatus("PAID");
                    order.setPaymentDate(LocalDateTime.now());
                    order.setPaymentReference(sourceId);
                    orderRepository.save(order);
                    
                    System.out.println("✅ Order " + orderId + " marked as PAID via webhook!");
                    
                    response.put("success", true);
                    response.put("message", "Order " + orderId + " marked as paid");
                } else {
                    response.put("success", false);
                    response.put("message", "Order not found");
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        
        return response;
    }
}