package com.example.backend.service;

import com.example.backend.model.Product;
import com.example.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @PostConstruct
    @Transactional
    public void initSampleProducts() {
        // ✅ CHECK MUNA KUNG MAY PRODUCTS NA
        if (productRepository.count() > 0) {
            System.out.println("✅ Products already exist (" + productRepository.count() + " products). Skipping initialization.");
            System.out.println("   Your existing products and images are preserved!");
            return;  // ⭐ EXIT AGAD - huwag i-delete ang existing products
        }
        
        // ⭐ ONLY RUN THIS CODE IF NO PRODUCTS EXIST (FIRST TIME ONLY)
        System.out.println("📦 First time setup - Initializing sample products...");
        
        List<Product> products = new ArrayList<>();
        
        // ============ PAPER PRODUCTS (1-16) ============
        
        // 1. Bond Paper
        Product p1 = new Product();
        p1.setName("Bond Paper");
        p1.setCategory("Paper Products");
        p1.setDescription("Premium quality bond paper perfect for all your printing and writing needs.");
        p1.setImageUrl("/images/products/bond-paper.jpg");
        p1.setSku("PAP-001");
        p1.setInStock(true);
        List<Product.Size> sizes1 = new ArrayList<>();
        sizes1.add(new Product.Size("A4", "210×297mm", 20.0, 100));
        sizes1.add(new Product.Size("Short", "8.5×13in", 20.0, 100));
        sizes1.add(new Product.Size("Long", "8.5×14in", 20.0, 100));
        p1.setSizes(sizes1);
        products.add(p1);

        // 2. Spiral Notebook
        Product p2 = new Product();
        p2.setName("Spiral Notebook");
        p2.setCategory("Paper Products");
        p2.setDescription("Durable spiral-bound notebooks with quality lined paper.");
        p2.setImageUrl("/images/products/notebook.jpg");
        p2.setSku("PAP-002");
        p2.setInStock(true);
        List<Product.Size> sizes2 = new ArrayList<>();
        sizes2.add(new Product.Size("Small", "5×7in", 100.0, 100));
        sizes2.add(new Product.Size("Medium", "8×10in", 200.0, 100));
        sizes2.add(new Product.Size("Large", "11×14in", 300.0, 100));
        p2.setSizes(sizes2);
        products.add(p2);

        // 3. Intermediate Pad
        Product p3 = new Product();
        p3.setName("Intermediate Pad");
        p3.setCategory("Paper Products");
        p3.setDescription("Standard intermediate pad with ruled lines.");
        p3.setImageUrl("/images/products/intermediate-pad.jpg");
        p3.setSku("PAP-003");
        p3.setInStock(true);
        List<Product.Size> sizes3 = new ArrayList<>();
        sizes3.add(new Product.Size("1 Pad", "80 leaves", 45.0, 100));
        sizes3.add(new Product.Size("3-Pack", "80 leaves each", 120.0, 100));
        sizes3.add(new Product.Size("10-Pack", "80 leaves each", 380.0, 100));
        p3.setSizes(sizes3);
        products.add(p3);
        
        // 4. Yellow Pad
        Product p4 = new Product();
        p4.setName("Yellow Pad");
        p4.setCategory("Paper Products");
        p4.setDescription("Classic yellow legal pad with wide-ruled lines.");
        p4.setImageUrl("/images/products/yellow-pad.jpg");
        p4.setSku("PAP-004");
        p4.setInStock(true);
        List<Product.Size> sizes4 = new ArrayList<>();
        sizes4.add(new Product.Size("1 Pad", "80 leaves", 55.0, 100));
        sizes4.add(new Product.Size("3-Pack", "80 leaves each", 150.0, 100));
        sizes4.add(new Product.Size("10-Pack", "80 leaves each", 450.0, 100));
        p4.setSizes(sizes4);
        products.add(p4);
        
        // 5. Graph Paper
        Product p5 = new Product();
        p5.setName("Graph Paper");
        p5.setCategory("Paper Products");
        p5.setDescription("Precision graph paper with grid lines.");
        p5.setImageUrl("/images/products/graph-paper.jpg");
        p5.setSku("PAP-005");
        p5.setInStock(true);
        List<Product.Size> sizes5 = new ArrayList<>();
        sizes5.add(new Product.Size("1 Pad", "5mm grid", 65.0, 100));
        sizes5.add(new Product.Size("3-Pack", "5mm grid", 175.0, 100));
        sizes5.add(new Product.Size("10-Pack", "5mm grid", 550.0, 100));
        p5.setSizes(sizes5);
        products.add(p5);
        
        // 6. Oslo Paper
        Product p6 = new Product();
        p6.setName("Oslo Paper");
        p6.setCategory("Paper Products");
        p6.setDescription("Thick white oslo paper perfect for art projects.");
        p6.setImageUrl("/images/products/oslo-paper.jpg");
        p6.setSku("PAP-006");
        p6.setInStock(true);
        List<Product.Size> sizes6 = new ArrayList<>();
        sizes6.add(new Product.Size("10 Sheets", "9×12in", 35.0, 100));
        sizes6.add(new Product.Size("25 Sheets", "9×12in", 75.0, 100));
        sizes6.add(new Product.Size("50 Sheets", "9×12in", 140.0, 100));
        p6.setSizes(sizes6);
        products.add(p6);
        
        // 7. Manila Paper
        Product p7 = new Product();
        p7.setName("Manila Paper");
        p7.setCategory("Paper Products");
        p7.setDescription("Traditional manila paper for arts and crafts.");
        p7.setImageUrl("/images/products/manila-paper.jpg");
        p7.setSku("PAP-007");
        p7.setInStock(true);
        List<Product.Size> sizes7 = new ArrayList<>();
        sizes7.add(new Product.Size("10 Sheets", "9×12in", 40.0, 100));
        sizes7.add(new Product.Size("25 Sheets", "9×12in", 85.0, 100));
        sizes7.add(new Product.Size("50 Sheets", "9×12in", 160.0, 100));
        p7.setSizes(sizes7);
        products.add(p7);
        
        // 8. Cartolina
        Product p8 = new Product();
        p8.setName("Cartolina");
        p8.setCategory("Paper Products");
        p8.setDescription("Colorful cartolina paper for school projects.");
        p8.setImageUrl("/images/products/Cartolina.jpg");
        p8.setSku("PAP-008");
        p8.setInStock(true);
        List<Product.Size> sizes8 = new ArrayList<>();
        sizes8.add(new Product.Size("10 Sheets", "Assorted", 60.0, 100));
        sizes8.add(new Product.Size("25 Sheets", "Assorted", 135.0, 100));
        sizes8.add(new Product.Size("50 Sheets", "Assorted", 250.0, 100));
        p8.setSizes(sizes8);
        products.add(p8);
        
        // 9. Construction Paper
        Product p9 = new Product();
        p9.setName("Construction Paper");
        p9.setCategory("Paper Products");
        p9.setDescription("Heavy-duty construction paper for art projects.");
        p9.setImageUrl("/images/products/construction-paper.jpg");
        p9.setSku("PAP-009");
        p9.setInStock(true);
        List<Product.Size> sizes9 = new ArrayList<>();
        sizes9.add(new Product.Size("50 Sheets", "Assorted", 120.0, 100));
        sizes9.add(new Product.Size("100 Sheets", "Assorted", 220.0, 100));
        sizes9.add(new Product.Size("200 Sheets", "Assorted", 400.0, 100));
        p9.setSizes(sizes9);
        products.add(p9);
        
        // 10. Colored Paper
        Product p10 = new Product();
        p10.setName("Colored Paper");
        p10.setCategory("Paper Products");
        p10.setDescription("Vibrant colored paper for printing and crafts.");
        p10.setImageUrl("/images/products/colored-paper.jpg");
        p10.setSku("PAP-010");
        p10.setInStock(true);
        List<Product.Size> sizes10 = new ArrayList<>();
        sizes10.add(new Product.Size("50 Sheets", "Assorted", 150.0, 100));
        sizes10.add(new Product.Size("100 Sheets", "Assorted", 280.0, 100));
        sizes10.add(new Product.Size("200 Sheets", "Assorted", 520.0, 100));
        p10.setSizes(sizes10);
        products.add(p10);
        
        // 11. Index Cards
        Product p11 = new Product();
        p11.setName("Index Cards");
        p11.setCategory("Paper Products");
        p11.setDescription("Study and note-taking index cards.");
        p11.setImageUrl("/images/products/index-cards.jpg");
        p11.setSku("PAP-011");
        p11.setInStock(true);
        List<Product.Size> sizes11 = new ArrayList<>();
        sizes11.add(new Product.Size("100 Cards", "3×5in", 80.0, 100));
        sizes11.add(new Product.Size("200 Cards", "3×5in", 150.0, 100));
        sizes11.add(new Product.Size("500 Cards", "3×5in", 350.0, 100));
        p11.setSizes(sizes11);
        products.add(p11);
        
        // 12. Tracing Paper
        Product p12 = new Product();
        p12.setName("Tracing Paper");
        p12.setCategory("Paper Products");
        p12.setDescription("Translucent tracing paper for artists.");
        p12.setImageUrl("/images/products/tracing-paper.jpg");
        p12.setSku("PAP-012");
        p12.setInStock(true);
        List<Product.Size> sizes12 = new ArrayList<>();
        sizes12.add(new Product.Size("20 Sheets", "8.5×11in", 90.0, 100));
        sizes12.add(new Product.Size("50 Sheets", "8.5×11in", 200.0, 100));
        sizes12.add(new Product.Size("100 Sheets", "8.5×11in", 380.0, 100));
        p12.setSizes(sizes12);
        products.add(p12);
        
        // 13. Cardstock
        Product p13 = new Product();
        p13.setName("Cardstock");
        p13.setCategory("Paper Products");
        p13.setDescription("Thick cardstock paper for crafts.");
        p13.setImageUrl("/images/products/cardstock.jpg");
        p13.setSku("PAP-013");
        p13.setInStock(true);
        List<Product.Size> sizes13 = new ArrayList<>();
        sizes13.add(new Product.Size("50 Sheets", "White", 180.0, 100));
        sizes13.add(new Product.Size("100 Sheets", "White", 340.0, 100));
        sizes13.add(new Product.Size("200 Sheets", "White", 640.0, 100));
        p13.setSizes(sizes13);
        products.add(p13);
        
        // 14. Photo Paper
        Product p14 = new Product();
        p14.setName("Photo Paper");
        p14.setCategory("Paper Products");
        p14.setDescription("Glossy photo paper for high-quality printing.");
        p14.setImageUrl("/images/products/photo-paper.jpg");
        p14.setSku("PAP-014");
        p14.setInStock(true);
        List<Product.Size> sizes14 = new ArrayList<>();
        sizes14.add(new Product.Size("20 Sheets", "Glossy", 150.0, 100));
        sizes14.add(new Product.Size("50 Sheets", "Glossy", 350.0, 100));
        sizes14.add(new Product.Size("100 Sheets", "Glossy", 650.0, 100));
        p14.setSizes(sizes14);
        products.add(p14);
        
        // 15. Kraft Paper
        Product p15 = new Product();
        p15.setName("Kraft Paper");
        p15.setCategory("Paper Products");
        p15.setDescription("Eco-friendly kraft paper for wrapping.");
        p15.setImageUrl("/images/products/kraft-paper.jpg");
        p15.setSku("PAP-015");
        p15.setInStock(true);
        List<Product.Size> sizes15 = new ArrayList<>();
        sizes15.add(new Product.Size("10 Sheets", "Brown", 70.0, 100));
        sizes15.add(new Product.Size("25 Sheets", "Brown", 160.0, 100));
        sizes15.add(new Product.Size("50 Sheets", "Brown", 300.0, 100));
        p15.setSizes(sizes15);
        products.add(p15);
        
        // 16. Watercolor Paper
        Product p16 = new Product();
        p16.setName("Watercolor Paper");
        p16.setCategory("Paper Products");
        p16.setDescription("Textured watercolor paper for painting.");
        p16.setImageUrl("/images/products/watercolor-paper.jpg");
        p16.setSku("PAP-016");
        p16.setInStock(true);
        List<Product.Size> sizes16 = new ArrayList<>();
        sizes16.add(new Product.Size("10 Sheets", "Cold Press", 120.0, 100));
        sizes16.add(new Product.Size("20 Sheets", "Cold Press", 220.0, 100));
        sizes16.add(new Product.Size("50 Sheets", "Cold Press", 520.0, 100));
        p16.setSizes(sizes16);
        products.add(p16);
        
        // ============ WRITING TOOLS (17-26) ============
        
        // 17. Graphite Pencils
        Product p17 = new Product();
        p17.setName("Graphite Pencils");
        p17.setCategory("Writing Tools");
        p17.setDescription("Premium graphite pencils for everyday use.");
        p17.setImageUrl("/images/products/pencils.jpg");
        p17.setSku("WRT-001");
        p17.setInStock(true);
        List<Product.Size> sizes17 = new ArrayList<>();
        sizes17.add(new Product.Size("Basic", "12 pcs", 150.0, 100));
        sizes17.add(new Product.Size("Deluxe", "24 pcs", 270.0, 100));
        sizes17.add(new Product.Size("Premium", "48 pcs", 500.0, 100));
        p17.setSizes(sizes17);
        products.add(p17);
        
        // 18. Ballpoint Pens
        Product p18 = new Product();
        p18.setName("Ballpoint Pens");
        p18.setCategory("Writing Tools");
        p18.setDescription("Smooth writing ballpoint pens.");
        p18.setImageUrl("/images/products/ballpoint-pens.jpg");
        p18.setSku("WRT-002");
        p18.setInStock(true);
        List<Product.Size> sizes18 = new ArrayList<>();
        sizes18.add(new Product.Size("Basic", "10 pcs", 125.0, 100));
        sizes18.add(new Product.Size("Deluxe", "20 pcs", 225.0, 100));
        sizes18.add(new Product.Size("Premium", "50 pcs", 500.0, 100));
        p18.setSizes(sizes18);
        products.add(p18);
        
        // 19. Highlighters
        Product p19 = new Product();
        p19.setName("Highlighters");
        p19.setCategory("Writing Tools");
        p19.setDescription("Bright fluorescent highlighters.");
        p19.setImageUrl("/images/products/highlighters.jpg");
        p19.setSku("WRT-003");
        p19.setInStock(true);
        List<Product.Size> sizes19 = new ArrayList<>();
        sizes19.add(new Product.Size("Basic", "4 colors", 199.0, 100));
        sizes19.add(new Product.Size("Deluxe", "8 colors", 350.0, 100));
        sizes19.add(new Product.Size("Premium", "12 colors", 480.0, 100));
        p19.setSizes(sizes19);
        products.add(p19);
        
        // 20. Mechanical Pencils
        Product p20 = new Product();
        p20.setName("Mechanical Pencils");
        p20.setCategory("Writing Tools");
        p20.setDescription("Refillable mechanical pencils.");
        p20.setImageUrl("/images/products/mechanical-pencils.jpg");
        p20.setSku("WRT-004");
        p20.setInStock(true);
        List<Product.Size> sizes20 = new ArrayList<>();
        sizes20.add(new Product.Size("Basic", "2 pcs", 85.0, 100));
        sizes20.add(new Product.Size("Deluxe", "5 pcs", 200.0, 100));
        sizes20.add(new Product.Size("Premium", "10 pcs", 380.0, 100));
        p20.setSizes(sizes20);
        products.add(p20);
        
        // 21. Gel Pens
        Product p21 = new Product();
        p21.setName("Gel Pens");
        p21.setCategory("Writing Tools");
        p21.setDescription("Smooth gel ink pens.");
        p21.setImageUrl("/images/products/gel-pens.jpg");
        p21.setSku("WRT-005");
        p21.setInStock(true);
        List<Product.Size> sizes21 = new ArrayList<>();
        sizes21.add(new Product.Size("Basic", "6 colors", 149.0, 100));
        sizes21.add(new Product.Size("Deluxe", "12 colors", 280.0, 100));
        sizes21.add(new Product.Size("Premium", "24 colors", 520.0, 100));
        p21.setSizes(sizes21);
        products.add(p21);
        
        // 22. Whiteboard Markers
        Product p22 = new Product();
        p22.setName("Whiteboard Markers");
        p22.setCategory("Writing Tools");
        p22.setDescription("Dry erase markers for whiteboards.");
        p22.setImageUrl("/images/products/whiteboard-markers.jpg");
        p22.setSku("WRT-006");
        p22.setInStock(true);
        List<Product.Size> sizes22 = new ArrayList<>();
        sizes22.add(new Product.Size("Basic", "4 colors", 149.0, 100));
        sizes22.add(new Product.Size("Deluxe", "8 colors", 280.0, 100));
        sizes22.add(new Product.Size("Premium", "12 colors", 400.0, 100));
        p22.setSizes(sizes22);
        products.add(p22);
        
        // 23. Permanent Markers
        Product p23 = new Product();
        p23.setName("Permanent Markers");
        p23.setCategory("Writing Tools");
        p23.setDescription("Water-resistant permanent markers.");
        p23.setImageUrl("/images/products/permanent-markers.jpg");
        p23.setSku("WRT-007");
        p23.setInStock(true);
        List<Product.Size> sizes23 = new ArrayList<>();
        sizes23.add(new Product.Size("Basic", "4 colors", 99.0, 100));
        sizes23.add(new Product.Size("Deluxe", "8 colors", 180.0, 100));
        sizes23.add(new Product.Size("Premium", "12 colors", 260.0, 100));
        p23.setSizes(sizes23);
        products.add(p23);
        
        // 24. Correction Tape
        Product p24 = new Product();
        p24.setName("Correction Tape");
        p24.setCategory("Writing Tools");
        p24.setDescription("Quick-drying correction tape.");
        p24.setImageUrl("/images/products/correction-tape.jpg");
        p24.setSku("WRT-008");
        p24.setInStock(true);
        List<Product.Size> sizes24 = new ArrayList<>();
        sizes24.add(new Product.Size("Basic", "1 pc", 45.0, 100));
        sizes24.add(new Product.Size("Deluxe", "3 pcs", 120.0, 100));
        sizes24.add(new Product.Size("Premium", "5 pcs", 190.0, 100));
        p24.setSizes(sizes24);
        products.add(p24);
        
        // 25. Erasers
        Product p25 = new Product();
        p25.setName("Erasers");
        p25.setCategory("Writing Tools");
        p25.setDescription("Soft erasers that don't smudge.");
        p25.setImageUrl("/images/products/erasers.jpg");
        p25.setSku("WRT-009");
        p25.setInStock(true);
        List<Product.Size> sizes25 = new ArrayList<>();
        sizes25.add(new Product.Size("Basic", "3 pcs", 35.0, 100));
        sizes25.add(new Product.Size("Deluxe", "10 pcs", 100.0, 100));
        sizes25.add(new Product.Size("Premium", "20 pcs", 180.0, 100));
        p25.setSizes(sizes25);
        products.add(p25);
        
        // 26. Pencil Sharpeners
        Product p26 = new Product();
        p26.setName("Pencil Sharpeners");
        p26.setCategory("Writing Tools");
        p26.setDescription("Dual-hole pencil sharpeners.");
        p26.setImageUrl("/images/products/sharpeners.jpg");
        p26.setSku("WRT-010");
        p26.setInStock(true);
        List<Product.Size> sizes26 = new ArrayList<>();
        sizes26.add(new Product.Size("Basic", "1 pc", 25.0, 100));
        sizes26.add(new Product.Size("Deluxe", "3 pcs", 65.0, 100));
        sizes26.add(new Product.Size("Premium", "5 pcs", 100.0, 100));
        p26.setSizes(sizes26);
        products.add(p26);
        
        // ============ COLORING MATERIALS (27-36) ============
        
        // 27. Wax Crayons
        Product p27 = new Product();
        p27.setName("Wax Crayons");
        p27.setCategory("Coloring Materials");
        p27.setDescription("Smooth wax crayons for kids.");
        p27.setImageUrl("/images/products/crayons.jpg");
        p27.setSku("CLR-001");
        p27.setInStock(true);
        List<Product.Size> sizes27 = new ArrayList<>();
        sizes27.add(new Product.Size("12 Colors", "Basic set", 45.0, 100));
        sizes27.add(new Product.Size("24 Colors", "Standard set", 85.0, 100));
        sizes27.add(new Product.Size("48 Colors", "Professional set", 160.0, 100));
        p27.setSizes(sizes27);
        products.add(p27);
        
        // 28. Colored Pencils
        Product p28 = new Product();
        p28.setName("Colored Pencils");
        p28.setCategory("Coloring Materials");
        p28.setDescription("High-quality colored pencils.");
        p28.setImageUrl("/images/products/colored-pencils.jpg");
        p28.setSku("CLR-002");
        p28.setInStock(true);
        List<Product.Size> sizes28 = new ArrayList<>();
        sizes28.add(new Product.Size("12 Colors", "Basic set", 149.0, 100));
        sizes28.add(new Product.Size("24 Colors", "Standard set", 280.0, 100));
        sizes28.add(new Product.Size("48 Colors", "Professional set", 520.0, 100));
        p28.setSizes(sizes28);
        products.add(p28);
        
        // 29. Watercolor Pencils
        Product p29 = new Product();
        p29.setName("Watercolor Pencils");
        p29.setCategory("Coloring Materials");
        p29.setDescription("Water-soluble colored pencils.");
        p29.setImageUrl("/images/products/watercolor-pencils.jpg");
        p29.setSku("CLR-003");
        p29.setInStock(true);
        List<Product.Size> sizes29 = new ArrayList<>();
        sizes29.add(new Product.Size("12 Colors", "Basic set", 199.0, 100));
        sizes29.add(new Product.Size("24 Colors", "Standard set", 380.0, 100));
        sizes29.add(new Product.Size("36 Colors", "Professional set", 550.0, 100));
        p29.setSizes(sizes29);
        products.add(p29);
        
        // 30. Water-based Markers
        Product p30 = new Product();
        p30.setName("Water-based Markers");
        p30.setCategory("Coloring Materials");
        p30.setDescription("Washable water-based markers.");
        p30.setImageUrl("/images/products/watercolor-markers.jpg");
        p30.setSku("CLR-004");
        p30.setInStock(true);
        List<Product.Size> sizes30 = new ArrayList<>();
        sizes30.add(new Product.Size("12 Colors", "Basic set", 129.0, 100));
        sizes30.add(new Product.Size("24 Colors", "Standard set", 240.0, 100));
        sizes30.add(new Product.Size("36 Colors", "Professional set", 350.0, 100));
        p30.setSizes(sizes30);
        products.add(p30);
        
        // 31. Alcohol-based Markers
        Product p31 = new Product();
        p31.setName("Alcohol-based Markers");
        p31.setCategory("Coloring Materials");
        p31.setDescription("Professional alcohol markers.");
        p31.setImageUrl("/images/products/alcohol-markers.jpg");
        p31.setSku("CLR-005");
        p31.setInStock(true);
        List<Product.Size> sizes31 = new ArrayList<>();
        sizes31.add(new Product.Size("12 Colors", "Basic set", 399.0, 100));
        sizes31.add(new Product.Size("24 Colors", "Standard set", 750.0, 100));
        sizes31.add(new Product.Size("48 Colors", "Professional set", 1400.0, 100));
        p31.setSizes(sizes31);
        products.add(p31);
        
        // 32. Washable Markers
        Product p32 = new Product();
        p32.setName("Washable Markers");
        p32.setCategory("Coloring Materials");
        p32.setDescription("Easy-to-clean washable markers.");
        p32.setImageUrl("/images/products/washable-markers.jpg");
        p32.setSku("CLR-006");
        p32.setInStock(true);
        List<Product.Size> sizes32 = new ArrayList<>();
        sizes32.add(new Product.Size("8 Colors", "Basic set", 89.0, 100));
        sizes32.add(new Product.Size("16 Colors", "Standard set", 160.0, 100));
        sizes32.add(new Product.Size("24 Colors", "Professional set", 230.0, 100));
        p32.setSizes(sizes32);
        products.add(p32);
        
        // 33. Oil Pastels
        Product p33 = new Product();
        p33.setName("Oil Pastels");
        p33.setCategory("Coloring Materials");
        p33.setDescription("Smooth oil pastels for blending.");
        p33.setImageUrl("/images/products/oil-pastels.jpg");
        p33.setSku("CLR-007");
        p33.setInStock(true);
        List<Product.Size> sizes33 = new ArrayList<>();
        sizes33.add(new Product.Size("12 Colors", "Basic set", 99.0, 100));
        sizes33.add(new Product.Size("24 Colors", "Standard set", 180.0, 100));
        sizes33.add(new Product.Size("36 Colors", "Professional set", 260.0, 100));
        p33.setSizes(sizes33);
        products.add(p33);
        
        // 34. Soft Pastels
        Product p34 = new Product();
        p34.setName("Soft Pastels");
        p34.setCategory("Coloring Materials");
        p34.setDescription("Chalky soft pastels for artists.");
        p34.setImageUrl("/images/products/soft-pastels.jpg");
        p34.setSku("CLR-008");
        p34.setInStock(true);
        List<Product.Size> sizes34 = new ArrayList<>();
        sizes34.add(new Product.Size("12 Colors", "Basic set", 149.0, 100));
        sizes34.add(new Product.Size("24 Colors", "Standard set", 280.0, 100));
        sizes34.add(new Product.Size("36 Colors", "Professional set", 400.0, 100));
        p34.setSizes(sizes34);
        products.add(p34);
        
        // 35. Glitter Glue
        Product p35 = new Product();
        p35.setName("Glitter Glue");
        p35.setCategory("Coloring Materials");
        p35.setDescription("Sparkling glitter glue for crafts.");
        p35.setImageUrl("/images/products/glitter-glue.jpg");
        p35.setSku("CLR-009");
        p35.setInStock(true);
        List<Product.Size> sizes35 = new ArrayList<>();
        sizes35.add(new Product.Size("4 Colors", "Basic set", 79.0, 100));
        sizes35.add(new Product.Size("8 Colors", "Standard set", 140.0, 100));
        sizes35.add(new Product.Size("12 Colors", "Professional set", 200.0, 100));
        p35.setSizes(sizes35);
        products.add(p35);
        
        // 36. Acrylic Paint
        Product p36 = new Product();
        p36.setName("Acrylic Paint");
        p36.setCategory("Coloring Materials");
        p36.setDescription("Vibrant acrylic paint for canvas.");
        p36.setImageUrl("/images/products/acrylic-paint.jpg");
        p36.setSku("CLR-010");
        p36.setInStock(true);
        List<Product.Size> sizes36 = new ArrayList<>();
        sizes36.add(new Product.Size("6 Colors", "Basic set", 149.0, 100));
        sizes36.add(new Product.Size("12 Colors", "Standard set", 280.0, 100));
        sizes36.add(new Product.Size("18 Colors", "Professional set", 400.0, 100));
        p36.setSizes(sizes36);
        products.add(p36);
        
        // Save all products (ONLY ON FIRST RUN)
        productRepository.saveAll(products);
        System.out.println("✅ " + products.size() + " sample products loaded with local images!");
    }
    
    // ===== REST OF YOUR EXISTING METHODS (Keep as is) =====
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }
    
    public List<Map<String, Object>> getAllProductsAsMap() {
        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Product product : products) {
            result.add(convertToMap(product));
        }
        
        return result;
    }
    
    public Map<String, Object> getProductByIdAsMap(Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        
        if (productOpt.isPresent()) {
            return convertToMap(productOpt.get());
        }
        
        return null;
    }
    
    private Map<String, Object> convertToMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", product.getId());
        map.put("name", product.getName());
        map.put("category", product.getCategory());
        map.put("description", product.getDescription());
        map.put("imageUrl", product.getImageUrl());
        map.put("sku", product.getSku());
        map.put("inStock", product.getInStock());
        
        List<Map<String, Object>> sizes = new ArrayList<>();
        if (product.getSizes() != null) {
            for (Product.Size size : product.getSizes()) {
                Map<String, Object> sizeMap = new HashMap<>();
                sizeMap.put("name", size.getName());
                sizeMap.put("desc", size.getDescription());
                sizeMap.put("price", size.getPrice());
                sizeMap.put("stock", size.getStock());
                sizes.add(sizeMap);
            }
        }
        map.put("sizes", sizes);
        
        return map;
    }
    
    public long getTotalProducts() {
        return productRepository.count();
    }
    
    public long getLowStockCount() {
        return getLowStockProducts().size();
    }
    
    public List<Product> getLowStockProducts() {
        return productRepository.findAll().stream()
            .filter(p -> {
                if (p.getSizes() != null) {
                    int totalStock = p.getSizes().stream()
                        .mapToInt(size -> size.getStock() != null ? size.getStock() : 0)
                        .sum();
                    return totalStock < 20;
                }
                return false;
            })
            .collect(Collectors.toList());
    }
    
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }
    
    public List<String> getAllCategories() {
        return productRepository.findAll().stream()
            .map(Product::getCategory)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
    }
    
    public List<Product> searchProducts(String keyword) {
        List<Product> byName = productRepository.findByNameContainingIgnoreCase(keyword);
        List<Product> bySku = productRepository.findBySkuContainingIgnoreCase(keyword);
        Set<Product> combined = new HashSet<>(byName);
        combined.addAll(bySku);
        return new ArrayList<>(combined);
    }
    
    @Transactional
    public Product createProduct(Product product) {
        product.setSku(generateSku(product));
        return productRepository.save(product);
    }
    
    @Transactional
    public Product updateProduct(Long id, Product productDetails) {
        Optional<Product> existingOpt = productRepository.findById(id);
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            existing.setName(productDetails.getName());
            existing.setCategory(productDetails.getCategory());
            existing.setDescription(productDetails.getDescription());
            existing.setImageUrl(productDetails.getImageUrl());
            existing.setInStock(productDetails.getInStock());
            existing.setSizes(productDetails.getSizes());
            return productRepository.save(existing);
        }
        return null;
    }
    
    @Transactional
    public boolean deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    @Transactional
    public Product updateStock(Long id, int newStock) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            // Update stock logic here if needed
            return productRepository.save(product);
        }
        return null;
    }
    
    private String generateSku(Product product) {
        String prefix = "PRD";
        if (product.getCategory() != null) {
            if (product.getCategory().contains("Paper")) prefix = "PAP";
            else if (product.getCategory().contains("Writing")) prefix = "WRT";
            else if (product.getCategory().contains("Coloring")) prefix = "CLR";
            else if (product.getCategory().contains("Storage")) prefix = "STR";
        }
        long count = productRepository.count() + 1;
        return prefix + "-" + String.format("%03d", count);
    }
}