package com.example.backend.dto;

import java.util.List;

public class OrderRequest {
    
    private Long userId;
    private Double total;
    private String paymentMethod;
    private String paymentReceipt;
    private List<?> items;
    private String roomBuilding;
    private String roomNumber;
    private String specialDelivery;
    private String gcashReference;
    private String senderName;
    private String paymentProof;  // ADD THIS FIELD
    
    // Constructors
    public OrderRequest() {}
    
    public OrderRequest(Long userId, Double total, String paymentMethod, String paymentReceipt, 
                        List<?> items, String roomBuilding, String roomNumber, String specialDelivery,
                        String gcashReference, String senderName, String paymentProof) {
        this.userId = userId;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.paymentReceipt = paymentReceipt;
        this.items = items;
        this.roomBuilding = roomBuilding;
        this.roomNumber = roomNumber;
        this.specialDelivery = specialDelivery;
        this.gcashReference = gcashReference;
        this.senderName = senderName;
        this.paymentProof = paymentProof;
    }
    
    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getPaymentReceipt() { return paymentReceipt; }
    public void setPaymentReceipt(String paymentReceipt) { this.paymentReceipt = paymentReceipt; }
    
    public List<?> getItems() { return items; }
    public void setItems(List<?> items) { this.items = items; }
    
    public String getRoomBuilding() { return roomBuilding; }
    public void setRoomBuilding(String roomBuilding) { this.roomBuilding = roomBuilding; }
    
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    
    public String getSpecialDelivery() { return specialDelivery; }
    public void setSpecialDelivery(String specialDelivery) { this.specialDelivery = specialDelivery; }
    
    public String getGcashReference() { return gcashReference; }
    public void setGcashReference(String gcashReference) { this.gcashReference = gcashReference; }
    
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    
    public String getPaymentProof() { return paymentProof; }  // ADD THIS GETTER
    public void setPaymentProof(String paymentProof) { this.paymentProof = paymentProof; }  // ADD THIS SETTER
}