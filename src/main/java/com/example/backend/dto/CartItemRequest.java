package com.example.backend.dto;

public class CartItemRequest {
    private Long userId;
    private Long productId;
    private String productName;
    private String productIcon;
    private String size;
    private Double price;
    private Integer quantity;
    
    public CartItemRequest() {}
    
    public CartItemRequest(Long userId, Long productId, String productName, 
                          String productIcon, String size, Double price, Integer quantity) {
        this.userId = userId;
        this.productId = productId;
        this.productName = productName;
        this.productIcon = productIcon;
        this.size = size;
        this.price = price;
        this.quantity = quantity;
    }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    public String getProductIcon() { return productIcon; }
    public void setProductIcon(String productIcon) { this.productIcon = productIcon; }
    
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}