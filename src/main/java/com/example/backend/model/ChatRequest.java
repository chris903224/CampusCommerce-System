package com.example.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChatRequest(
    @NotBlank(message = "Message is required")
    String message,
    
    @NotNull(message = "User ID is required")
    Long userId
) {}