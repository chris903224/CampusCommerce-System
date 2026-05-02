package com.example.backend.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String category;
    
    @Column(length = 1000)
    private String description;
    
    // ===== IMAGE URL - ADDED =====
    @Column(name = "image_url")
    private String imageUrl;  // Store as "/images/products/filename.jpg"
    
    private String sku;
    private Boolean inStock;
    
    @Convert(converter = SizesConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Size> sizes = new ArrayList<>();
    
    // ===== HELPER METHODS FOR IMAGE =====
    public String getFullImageUrl() {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }
        // Ensure it starts with / for web access
        return imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl;
    }
    
    public boolean hasImage() {
        return imageUrl != null && !imageUrl.isEmpty();
    }
    
    // ===== INNER CLASS SIZE =====
    public static class Size {
        private String name;
        private String description;
        private Double price;
        private Integer stock;
        
        public Size() {}
        
        public Size(String name, String description, Double price, Integer stock) {
            this.name = name;
            this.description = description;
            this.price = price;
            this.stock = stock;
        }
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
        
        public Integer getStock() { return stock; }
        public void setStock(Integer stock) { this.stock = stock; }
    }
    
    // ===== CONVERTER FOR SIZES =====
    @Converter
    public static class SizesConverter implements AttributeConverter<List<Size>, String> {
        
        private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        
        @Override
        public String convertToDatabaseColumn(List<Size> sizes) {
            try {
                return objectMapper.writeValueAsString(sizes);
            } catch (Exception e) {
                return "[]";
            }
        }
        
        @Override
        public List<Size> convertToEntityAttribute(String dbData) {
            try {
                if (dbData == null || dbData.isEmpty()) {
                    return new ArrayList<>();
                }
                return objectMapper.readValue(dbData, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Size.class));
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }
    }
    
    // ===== CONSTRUCTORS =====
    public Product() {}
    
    public Product(String name, String category, String description, String imageUrl, String sku, Boolean inStock) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.imageUrl = imageUrl;
        this.sku = sku;
        this.inStock = inStock;
    }
    
    // ===== GETTERS AND SETTERS =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    
    public Boolean getInStock() { return inStock; }
    public void setInStock(Boolean inStock) { this.inStock = inStock; }
    
    public List<Size> getSizes() { return sizes; }
    public void setSizes(List<Size> sizes) { this.sizes = sizes; }
}