package com.example.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("SJC Supply E-Commerce API")
                .version("1.0.0")
                .description("E-Commerce Backend API for SJC Supply")
                .contact(new Contact()
                    .name("SJC Supply Support")
                    .email("suppliessjc@gmail.com")))
            // DEVELOPMENT SERVER
            .addServersItem(new Server()
                .url("http://localhost:8080")
                .description("Development Server"))
            // PRODUCTION SERVER (RAILWAY) - IDAGDAG ITO
            .addServersItem(new Server()
                .url("https://sjc-supplies.up.railway.app")
                .description("Production Server (Railway)"))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .name("bearerAuth")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
