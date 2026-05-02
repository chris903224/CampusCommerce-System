package com.example.backend.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;
import org.springframework.stereotype.Component;
import java.io.InputStream;
import java.util.Base64;

@Component
public class ImageUtils {
    
    /**
     * Mag-load ng image mula sa static folder at i-convert sa Base64
     * Usage: ImageUtils.loadImageAsBase64("/images/products/bond-paper.jpg")
     */
    public static String loadImageAsBase64(String imagePath) {
        try {
            System.out.println("🔍 Attempting to load image: " + imagePath);
            
            // Remove leading slash if present
            String cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
            
            // Try different path variations
            String[] possiblePaths = {
                "static/" + cleanPath,                    // static/images/file.jpg
                "static" + imagePath,                      // static/images/file.jpg (with slash)
                cleanPath,                                  // images/file.jpg
                "static/images/" + getFileName(cleanPath), // static/images/file.jpg
                "images/" + getFileName(cleanPath)         // images/file.jpg
            };
            
            for (String path : possiblePaths) {
                System.out.println("  Trying path: " + path);
                try {
                    ClassPathResource resource = new ClassPathResource(path);
                    if (resource.exists()) {
                        System.out.println("  ✅ Found at: " + path);
                        InputStream inputStream = resource.getInputStream();
                        byte[] imageBytes = StreamUtils.copyToByteArray(inputStream);
                        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                        
                        // Detect image type
                        String mimeType = getMimeType(imagePath);
                        String result = "data:" + mimeType + ";base64," + base64Image;
                        System.out.println("  ✅ Image loaded successfully. Length: " + base64Image.length() + " chars");
                        return result;
                    }
                } catch (Exception e) {
                    // Continue to next path
                }
            }
            
            // If we get here, image not found in any path
            System.out.println("❌ Image not found in any path: " + imagePath);
            return getDefaultImage();
            
        } catch (Exception e) {
            System.out.println("❌ Error loading image: " + e.getMessage());
            e.printStackTrace();
            return getDefaultImage();
        }
    }
    
    /**
     * Get default placeholder image
     */
    private static String getDefaultImage() {
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjIuMTgiIHJ5PSIyLjE4Ii8+PGRlZnMvPjxwYXRoIGQ9Ik0xNiA4bC01IDUtMy0zLTQgNCIvPjwvc3ZnPg==";
    }
    
    private static String getFileName(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0) {
            return path.substring(lastSlash + 1);
        }
        return path;
    }
    
    private static String getMimeType(String path) {
        String lowerPath = path.toLowerCase();
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerPath.endsWith(".png")) {
            return "image/png";
        } else if (lowerPath.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerPath.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (lowerPath.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }
    
    /**
     * Check if image exists
     */
    public static boolean imageExists(String imagePath) {
        try {
            String cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
            ClassPathResource resource = new ClassPathResource("static/" + cleanPath);
            return resource.exists();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Get direct URL to image (for browser)
     */
    public static String getImageUrl(String imagePath) {
        if (imagePath == null || imagePath.isEmpty()) {
            return null;
        }
        
        // Ensure path starts with /
        if (!imagePath.startsWith("/")) {
            imagePath = "/" + imagePath;
        }
        
        // Remove /static prefix if present
        if (imagePath.startsWith("/static")) {
            imagePath = imagePath.substring(6);
        }
        
        return imagePath;
    }
}   