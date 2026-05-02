package com.example.backend.service;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatResponse;
import com.example.backend.repository.ChatRepository;
import com.example.backend.model.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatbotService {
    
    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    
    private final ChatRepository chatRepository;
    private final ProductService productService;
    
    @Autowired
    public ChatbotService(ChatRepository chatRepository, ProductService productService) {
        this.chatRepository = chatRepository;
        this.productService = productService;
    }
    
    private static final Map<String, List<Pattern>> INTENT_PATTERNS = new HashMap<>();
    
    static {
        INTENT_PATTERNS.put("GREETING", Arrays.asList(
            Pattern.compile("(hello|hi|hey|kamusta|musta|good morning|good afternoon|good evening|magandang umaga|magandang hapon|magandang gabi)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("PRODUCTS", Arrays.asList(
            Pattern.compile("(product|item|supplies|binebenta|available|anong meron|mga produkto|paninda|what do you sell|show products|list products|list all products|lahat ng produkto|paper products|writing tools|coloring materials|storage)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("PRICE", Arrays.asList(
            Pattern.compile("(price|cost|how much|magkano|presyo|halaga|magkano ang|presyo ng|magkano po ang)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("ORDER", Arrays.asList(
            Pattern.compile("(order|purchase|buy|bili|checkout|cart|paano umorder|how to order)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("TRACKING", Arrays.asList(
            Pattern.compile("(track|delivery|shipping|status|nasaan|where is my order|tracking number)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("PAYMENT", Arrays.asList(
            Pattern.compile("(payment|pay|gcash|cod|bayad|mode of payment|paano magbayad|how to pay)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("ACCOUNT", Arrays.asList(
            Pattern.compile("(account|profile|register|login|change password|update profile|personal information)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("HELP", Arrays.asList(
            Pattern.compile("(help|tulong|what can you do|guide|ano magagawa mo)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("THANKS", Arrays.asList(
            Pattern.compile("(thank|thanks|salamat|maraming salamat)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("GOODBYE", Arrays.asList(
            Pattern.compile("(bye|goodbye|paalam|exit|quit)", Pattern.CASE_INSENSITIVE)
        ));
        
        INTENT_PATTERNS.put("ROOM", Arrays.asList(
            Pattern.compile("(room|building|phinma|dimasalang|silang|delivery address|room number)", Pattern.CASE_INSENSITIVE)
        ));
    }
    
    public ChatResponse processMessage(String message, Long userId) {
        String lowerMessage = message.toLowerCase().trim();
        String intent = detectIntent(lowerMessage);
        
        log.info("Intent: {} | User: {} | Message: {}", intent, userId, message);
        
        String response = generateResponse(intent, message);
        
        saveChatMessage(ChatMessage.create(userId, message, response, intent));
        
        return ChatResponse.of(response, intent);
    }
    
    private String detectIntent(String message) {
        for (Map.Entry<String, List<Pattern>> entry : INTENT_PATTERNS.entrySet()) {
            for (Pattern pattern : entry.getValue()) {
                if (pattern.matcher(message).find()) {
                    return entry.getKey();
                }
            }
        }
        return "GENERAL";
    }
    
    private String generateResponse(String intent, String message) {
        String lowerMsg = message.toLowerCase();
        
        switch (intent) {
            case "GREETING":
                return getGreeting();
            case "PRODUCTS":
                if (lowerMsg.contains("paper")) {
                    return getProductsByCategoryResponse("Paper Products");
                } else if (lowerMsg.contains("writing")) {
                    return getProductsByCategoryResponse("Writing Tools");
                } else if (lowerMsg.contains("coloring")) {
                    return getProductsByCategoryResponse("Coloring Materials");
                } else if (lowerMsg.contains("storage")) {
                    return getProductsByCategoryResponse("Storage & Organization");
                }
                return getAllProductsResponse();
            case "PRICE":
                return getProductCardResponse(lowerMsg);
            case "ORDER":
                return getOrderResponse();
            case "TRACKING":
                return getTrackingResponse();
            case "PAYMENT":
                return getPaymentResponse();
            case "ACCOUNT":
                return getAccountResponse();
            case "HELP":
                return getHelpResponse();
            case "THANKS":
                return getThanksResponse();
            case "GOODBYE":
                return getGoodbyeResponse();
            case "ROOM":
                return getRoomResponse();
            default:
                return getGeneralResponse();
        }
    }
    
    private String getGreeting() {
        List<String> greetings = Arrays.asList(
            "Hello! Welcome to SJC Supplies!\n\nHow can I help you with your school supplies today?\n\nYou can ask me:\n  • Type 'products' - View all items\n  • Type 'Magkano ang Bond Paper?' - Check prices with image\n  • Type 'How to order?' - Shopping guide",
            "Kamusta! Welcome to SJC Supplies!\n\nWhat school supplies are you looking for?\n\nType 'products' to see our complete list of items!",
            "Hi there! Ready to shop?\n\nI can show you all our products, prices, and help you order!\n\nTry typing 'Magkano ang Bond Paper?' to see product with image."
        );
        return greetings.get(new Random().nextInt(greetings.size()));
    }
    
    private String getAllProductsResponse() {
        List<Product> allProducts = productService.getAllProducts();
        
        if (allProducts.isEmpty()) {
            return "No products found in our database. Please check back later!";
        }
        
        Map<String, List<Product>> productsByCategory = allProducts.stream()
            .collect(Collectors.groupingBy(Product::getCategory));
        
        StringBuilder response = new StringBuilder();
        response.append("SJC SUPPLIES - COMPLETE PRODUCT LIST\n\n");
        
        String[] categoryOrder = {"Paper Products", "Writing Tools", "Coloring Materials"};
        
        for (String category : categoryOrder) {
            List<Product> products = productsByCategory.get(category);
            if (products != null && !products.isEmpty()) {
                response.append(category).append("\n");
                
                int index = 1;
                for (Product product : products) {
                    double minPrice = product.getSizes().stream()
                        .mapToDouble(Product.Size::getPrice)
                        .min().orElse(0);
                    double maxPrice = product.getSizes().stream()
                        .mapToDouble(Product.Size::getPrice)
                        .max().orElse(0);
                    
                    String priceDisplay;
                    if (minPrice == maxPrice) {
                        priceDisplay = String.format("₱%.0f", minPrice);
                    } else {
                        priceDisplay = String.format("₱%.0f - ₱%.0f", minPrice, maxPrice);
                    }
                    
                    response.append("  ").append(index).append(". ").append(product.getName()).append("\n");
                    response.append("      Price: ").append(priceDisplay).append("\n");
                    response.append("      ").append(product.getDescription()).append("\n\n");
                    index++;
                }
            }
        }
        
        List<Product> storageProducts = productsByCategory.get("Storage & Organization");
        if (storageProducts != null && !storageProducts.isEmpty()) {
            response.append("Storage & Organization\n");
            int index = 1;
            for (Product product : storageProducts) {
                double minPrice = product.getSizes().stream()
                    .mapToDouble(Product.Size::getPrice)
                    .min().orElse(0);
                response.append("  ").append(index).append(". ").append(product.getName()).append("\n");
                response.append("      Price: ₱").append(String.format("%.0f", minPrice)).append("\n");
                response.append("      ").append(product.getDescription()).append("\n\n");
                index++;
            }
        }
        
        response.append("Total: ").append(allProducts.size()).append(" products available\n\n");
        response.append("Want specific product details?\n");
        response.append("  Type: Magkano ang [product name]?\n");
        response.append("  Example: Magkano ang Bond Paper?\n\n");
        response.append("Ready to buy? Go to Shop page to add items to your cart!");
        
        return response.toString();
    }
    
    private String getProductsByCategoryResponse(String category) {
        List<Product> products = productService.getProductsByCategory(category);
        
        if (products.isEmpty()) {
            return "No products found in " + category + " category.";
        }
        
        StringBuilder response = new StringBuilder();
        response.append(category).append("\n\n");
        
        int index = 1;
        for (Product product : products) {
            double minPrice = product.getSizes().stream()
                .mapToDouble(Product.Size::getPrice)
                .min().orElse(0);
            double maxPrice = product.getSizes().stream()
                .mapToDouble(Product.Size::getPrice)
                .max().orElse(0);
            
            String priceDisplay;
            if (minPrice == maxPrice) {
                priceDisplay = String.format("₱%.0f", minPrice);
            } else {
                priceDisplay = String.format("₱%.0f - ₱%.0f", minPrice, maxPrice);
            }
            
            response.append("  ").append(index).append(". ").append(product.getName()).append("\n");
            response.append("      Price: ").append(priceDisplay).append("\n");
            response.append("      ").append(product.getDescription()).append("\n\n");
            index++;
        }
        
        response.append("Type 'Magkano ang [product name]?' for specific product prices with images.");
        return response.toString();
    }
    
    // PRODUCT CARD WITH ONCLICK - Using localhost:8080
    private String getProductCardResponse(String message) {
        List<Product> allProducts = productService.getAllProducts();
        
        log.info("Searching for product in message: {}", message);
        
        Product foundProduct = null;
        
        // Search by name
        for (Product product : allProducts) {
            if (message.contains(product.getName().toLowerCase())) {
                foundProduct = product;
                log.info("Found product: {} with ID: {}", product.getName(), product.getId());
                break;
            }
        }
        
        // Common name variations
        if (foundProduct == null) {
            if (message.contains("bond paper") || message.contains("bond")) {
                foundProduct = findProductByName(allProducts, "Bond Paper");
            } else if (message.contains("gel pen") || message.contains("gel pens")) {
                foundProduct = findProductByName(allProducts, "Gel Pens");
            } else if (message.contains("colored pencil") || message.contains("colored pencils")) {
                foundProduct = findProductByName(allProducts, "Colored Pencils");
            } else if (message.contains("notebook") || message.contains("spiral notebook")) {
                foundProduct = findProductByName(allProducts, "Spiral Notebook");
            } else if (message.contains("crayon") || message.contains("wax crayon")) {
                foundProduct = findProductByName(allProducts, "Wax Crayons");
            } else if (message.contains("marker")) {
                if (message.contains("whiteboard")) {
                    foundProduct = findProductByName(allProducts, "Whiteboard Markers");
                } else if (message.contains("water")) {
                    foundProduct = findProductByName(allProducts, "Water-based Markers");
                } else if (message.contains("alcohol")) {
                    foundProduct = findProductByName(allProducts, "Alcohol-based Markers");
                } else if (message.contains("washable")) {
                    foundProduct = findProductByName(allProducts, "Washable Markers");
                }
            } else if (message.contains("pencil") && !message.contains("colored")) {
                foundProduct = findProductByName(allProducts, "Graphite Pencils");
            } else if (message.contains("mechanical pencil")) {
                foundProduct = findProductByName(allProducts, "Mechanical Pencils");
            } else if (message.contains("highlighter")) {
                foundProduct = findProductByName(allProducts, "Highlighters");
            } else if (message.contains("ballpoint")) {
                foundProduct = findProductByName(allProducts, "Ballpoint Pens");
            }
        }
        
        if (foundProduct != null) {
            // Use localhost:8080 since Spring Boot serves everything
            String frontendUrl = "http://localhost:8080";
            Long productId = foundProduct.getId();
            String imageUrl = foundProduct.getImageUrl();
            
            // Fallback image if none exists
            if (imageUrl == null || imageUrl.isEmpty() || imageUrl.equals("/images/products/null")) {
                imageUrl = "https://via.placeholder.com/80x80?text=No+Image";
            }
            
            StringBuilder sb = new StringBuilder();
            
            // Use onclick with window.location.href for same-origin navigation
            sb.append("<div onclick=\"window.location.href='").append(frontendUrl).append("/dashboard.html?page=shop&productId=").append(productId).append("'\" ");
            sb.append("style='border: 1px solid #e0e0e0; border-radius: 12px; padding: 12px; margin: 10px 0; background: #ffffff; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>");
            sb.append("<div style='display: flex; gap: 12px; align-items: center;'>");
            
            // Product Image
            sb.append("<img src='").append(imageUrl).append("' alt='").append(foundProduct.getName()).append("' style='width: 70px; height: 70px; object-fit: cover; border-radius: 8px;'>");
            
            // Product Info
            sb.append("<div style='flex: 1;'>");
            sb.append("<strong style='font-size: 14px; color: #333;'>").append(foundProduct.getName()).append("</strong><br>");
            String shortDesc = foundProduct.getDescription().length() > 50 ? 
                foundProduct.getDescription().substring(0, 50) + "..." : 
                foundProduct.getDescription();
            sb.append("<span style='font-size: 12px; color: #666;'>").append(shortDesc).append("</span><br>");
            
            // Price
            double minPrice = foundProduct.getSizes().stream()
                .mapToDouble(Product.Size::getPrice)
                .min().orElse(0);
            sb.append("<span style='color: #2ecc71; font-weight: bold; font-size: 14px;'>₱").append(String.format("%.0f", minPrice)).append("</span>");
            sb.append("</div>");
            
            // Arrow indicator
            sb.append("<div style='color: #999; font-size: 16px;'>&gt;</div>");
            sb.append("</div>");
            
            // Sizes
            sb.append("<div style='margin-top: 10px;'>");
            sb.append("<span style='font-size: 11px; color: #666;'>Available Sizes:</span><br>");
            for (Product.Size size : foundProduct.getSizes()) {
                sb.append("<span style='display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 15px; font-size: 11px; margin: 3px;'>");
                sb.append(size.getName()).append(" - ₱").append(String.format("%.0f", size.getPrice()));
                if (size.getStock() != null && size.getStock() > 0) {
                    sb.append(" (").append(size.getStock()).append(" left)");
                }
                sb.append("</span>");
            }
            sb.append("</div>");
            
            sb.append("</div>");
            
            return sb.toString();
        }
        
        return getAllProductsSummary(allProducts);
    }
    
    private Product findProductByName(List<Product> products, String name) {
        return products.stream()
            .filter(p -> p.getName().equalsIgnoreCase(name))
            .findFirst()
            .orElse(null);
    }
    
    private String getAllProductsSummary(List<Product> products) {
        StringBuilder sb = new StringBuilder();
        sb.append("Quick Price Guide\n\n");
        
        Map<String, List<Product>> byCategory = products.stream()
            .collect(Collectors.groupingBy(Product::getCategory));
        
        for (Map.Entry<String, List<Product>> entry : byCategory.entrySet()) {
            sb.append(entry.getKey()).append("\n");
            for (Product product : entry.getValue()) {
                double minPrice = product.getSizes().stream()
                    .mapToDouble(Product.Size::getPrice)
                    .min().orElse(0);
                sb.append("  • ").append(product.getName())
                  .append(" - ₱").append(String.format("%.0f", minPrice)).append("\n");
            }
            sb.append("\n");
        }
        
        sb.append("For specific product details with image, type:\n");
        sb.append("  Magkano ang [product name]?\n");
        sb.append("  Example: Magkano ang Bond Paper?\n\n");
        sb.append("Or type 'products' to see complete list with descriptions!");
        
        return sb.toString();
    }
    
    private String getOrderResponse() {
        return "How to Place an Order\n\n" +
               "  Step 1: Go to the Shop page\n" +
               "  Step 2: Browse our " + productService.getTotalProducts() + " products\n" +
               "  Step 3: Click on any product you like\n" +
               "  Step 4: Select Size/Quantity you want\n" +
               "  Step 5: Click Add to Cart\n" +
               "  Step 6: Go to your Cart (click cart icon)\n" +
               "  Step 7: Click Proceed to Checkout\n" +
               "  Step 8: Choose Payment Method (GCash/COD)\n" +
               "  Step 9: Enter your Room/Building details\n" +
               "  Step 10: Confirm and complete your order!\n\n" +
               "Need help with a specific product? Just ask!";
    }
    
    private String getTrackingResponse() {
        return "Order Tracking\n\n" +
               "To track your order:\n\n" +
               "  Step 1: Go to My Orders page\n" +
               "  Step 2: Find your order in the list\n" +
               "  Step 3: Check the Delivery Status\n\n" +
               "Delivery Status Meaning:\n" +
               "  • Pending - Order received, waiting for confirmation\n" +
               "  • Processing - Preparing your items\n" +
               "  • Shipped - On the way to your location\n" +
               "  • Delivered - Order completed\n\n" +
               "You'll also see your Tracking Number there!\n\n" +
               "Have an order number? I can help check it for you!";
    }
    
    private String getPaymentResponse() {
        return "Payment Methods\n\n" +
               "1. GCash (Manual)\n" +
               "   • Send payment to: 09152797837\n" +
               "   • Amount: Exact order total\n" +
               "   • Click 'Confirm Order' after payment\n\n" +
               "2. GCash (QR Code)\n" +
               "   • Scan the QR code in checkout\n" +
               "   • Enter exact amount\n" +
               "   • Upload payment proof\n\n" +
               "3. Cash on Delivery (COD)\n" +
               "   • Pay when the driver arrives\n" +
               "   • Prepare exact amount\n\n" +
               "All payments are secure! Need help with payment?";
    }
    
    private String getAccountResponse() {
        return "Account Management\n\n" +
               "  • Register - Create new account\n" +
               "  • Login - Access your account\n" +
               "  • Update Profile - Change personal information\n" +
               "  • Change Password - Keep your account secure\n" +
               "  • Add Room Info - For delivery purposes\n" +
               "  • Order History - View all your past orders\n\n" +
               "Go to My Account page to manage everything!\n\n" +
               "Need to update something specific? Tell me!";
    }
    
    private String getHelpResponse() {
        return "SJC AI Assistant - Help Guide\n\n" +
               "What I can do for you:\n\n" +
               "VIEW PRODUCTS\n" +
               "  • Type 'products' - See all " + productService.getTotalProducts() + " items\n" +
               "  • Type 'paper products' - See paper items only\n" +
               "  • Type 'writing tools' - See pens and pencils\n" +
               "  • Type 'coloring materials' - See art supplies\n\n" +
               "CHECK PRICES WITH IMAGE\n" +
               "  • Type 'Magkano ang Bond Paper?' - Shows product card with picture\n" +
               "  • Click the card to go to Shop page and view product\n" +
               "  • Type 'Price of Gel Pens'\n" +
               "  • Type 'How much is Spiral Notebook?'\n\n" +
               "SHOPPING HELP\n" +
               "  • Type 'How to order?' - Step by step guide\n" +
               "  • Type 'Track my order' - Delivery status\n" +
               "  • Type 'Payment methods' - GCash/COD information\n\n" +
               "ACCOUNT HELP\n" +
               "  • Type 'Update profile' - Change personal information\n" +
               "  • Type 'Change password' - Security settings\n" +
               "  • Type 'Room delivery' - Building and room information\n\n" +
               "Just type your question in English or Tagalog!\n" +
               "I'm here 24/7 to help you!";
    }
    
    private String getThanksResponse() {
        List<String> thanks = Arrays.asList(
            "You're welcome! Happy shopping at SJC Supplies!\n\nIf you need anything else, just ask!",
            "My pleasure! Let me know if you need anything else!\n\nType 'help' to see what I can do.",
            "Walang anuman! Salamat sa pagbisita sa SJC Supplies!\n\nMay iba pa ba akong maitutulong?",
            "Glad to help! Enjoy your school supplies shopping!\n\nTip: Type 'products' to see our complete list of " + productService.getTotalProducts() + " items!"
        );
        return thanks.get(new Random().nextInt(thanks.size()));
    }
    
    private String getGoodbyeResponse() {
        List<String> goodbyes = Arrays.asList(
            "Goodbye! Come back anytime!\n\nHappy studying and see you soon!",
            "See you later! Visit again for your school supplies!\n\nDon't forget to check our " + productService.getTotalProducts() + " products!",
            "Paalam! Ingat at balik ka ulit sa SJC Supplies!\n\nMaraming salamat sa pagbisita!",
            "Bye! Type 'products' anytime to see our complete catalog!\n\nHave a great day!"
        );
        return goodbyes.get(new Random().nextInt(goodbyes.size()));
    }
    
    private String getRoomResponse() {
        return "Room/Delivery Information\n\n" +
               "Please provide your delivery details:\n\n" +
               "Building Options:\n" +
               "  • Phinma Hall\n" +
               "  • Dimasalang Hall\n" +
               "  • Silang Hall\n\n" +
               "Room Number Format:\n" +
               "  • Format: PH201, DH305, S108\n" +
               "  • First letters indicate building\n" +
               "  • Numbers indicate floor and room\n\n" +
               "Special Delivery Instructions:\n" +
               "  • Leave at guard house\n" +
               "  • Call before delivery\n" +
               "  • Other specific instructions\n\n" +
               "You can save this information in your Profile page!\n\n" +
               "Need help setting it up? Just ask!";
    }
    
    private String getGeneralResponse() {
        return "I'm here to help!\n\n" +
               "Here are the things you can ask me:\n\n" +
               "PRODUCTS\n" +
               "  • Type 'products' - View all " + productService.getTotalProducts() + " items\n" +
               "  • Type 'paper products' - See paper items only\n" +
               "  • Type 'writing tools' - See pens and pencils\n" +
               "  • Type 'coloring materials' - See art supplies\n\n" +
               "PRICES WITH IMAGE\n" +
               "  • Type 'Magkano ang Bond Paper?' - Shows product card with picture\n" +
               "  • Click the card to go to Shop page\n\n" +
               "ORDERS\n" +
               "  • Type 'How to order?' - Step by step guide\n" +
               "  • Type 'Track my order' - Check delivery status\n\n" +
               "PAYMENT\n" +
               "  • Type 'Payment methods' - GCash and COD details\n" +
               "  • Type 'How to pay using GCash?'\n\n" +
               "ACCOUNT\n" +
               "  • Type 'Update profile' - Change personal info\n" +
               "  • Type 'Change password' - Security settings\n" +
               "  • Type 'Room delivery' - Add building and room\n\n" +
               "Try typing 'Magkano ang Bond Paper?' to see product with image!\n\n" +
               "Pwede ka ring magtanong sa Tagalog.";
    }
    
    private void saveChatMessage(ChatMessage message) {
        chatRepository.save(message);
        log.info("Saved chat message for user: {}", message.userId());
    }
    
    public List<ChatMessage> getChatHistory(Long userId) {
        return chatRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}