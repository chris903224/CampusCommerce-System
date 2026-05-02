package com.example.backend.repository;

import com.example.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Find by category
    List<Product> findByCategory(String category);
    
    // Find by name containing (case insensitive)
    List<Product> findByNameContainingIgnoreCase(String name);
    
    // Find by SKU containing (case insensitive)
    List<Product> findBySkuContainingIgnoreCase(String sku);
    
    // Find by name OR SKU containing (case insensitive) - ITO ANG KULANG
    List<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);
    
    // Find products that are in stock
    List<Product> findByInStockTrue();
    
    // Find by name exactly
    List<Product> findByName(String name);
}