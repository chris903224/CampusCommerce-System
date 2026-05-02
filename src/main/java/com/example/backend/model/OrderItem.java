package com.example.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "order_items")
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ===== ADD THIS RELATIONSHIP =====
    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonIgnore  // Prevent infinite recursion when converting to JSON
    private Order order;
    
    private Long productId;
    private String productName;
    private String productIcon;
    private String size;
    private Double price;
    private Integer quantity;
    private Double subtotal;
    
    public OrderItem() {}
    
    public OrderItem(Long productId, String productName, String productIcon, 
                     String size, Double price, Integer quantity) {
        this.productId = productId;
        this.productName = productName;
        this.productIcon = productIcon;
        this.size = size;
        this.price = price;
        this.quantity = quantity;
        this.subtotal = price * quantity;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    // ===== ADD THIS GETTER AND SETTER =====
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    public String getProductIcon() { return productIcon; }
    public void setProductIcon(String productIcon) { this.productIcon = productIcon; }
    
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { 
        this.price = price; 
        calculateSubtotal();
    }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { 
        this.quantity = quantity; 
        calculateSubtotal();
    }
    
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    
    // Helper method to calculate subtotal
    private void calculateSubtotal() {
        if (price != null && quantity != null) {
            this.subtotal = price * quantity;
        }
    }
}