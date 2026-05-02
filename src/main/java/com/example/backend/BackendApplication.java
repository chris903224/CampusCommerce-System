package com.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.example.backend.model")
@EnableJpaRepositories("com.example.backend.repository")
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("======================================");
        System.out.println("✅✅✅ BACKEND STARTED SUCCESSFULLY! ✅✅✅");
        System.out.println("🌐 http://localhost:8080/test");
        System.out.println("🌐 http://localhost:8080/api/auth/test");
        System.out.println("======================================");
    }
}