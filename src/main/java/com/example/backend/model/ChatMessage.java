package com.example.backend.model;

import java.time.LocalDateTime;

public record ChatMessage(
    Long id,
    Long userId,
    String userMessage,
    String botResponse,
    String intentDetected,
    LocalDateTime createdAt
) {
    public ChatMessage {
        createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }
    
    // Factory method for creating new messages
    public static ChatMessage create(Long userId, String userMessage, String botResponse, String intentDetected) {
        return new ChatMessage(null, userId, userMessage, botResponse, intentDetected, LocalDateTime.now());
    }
}