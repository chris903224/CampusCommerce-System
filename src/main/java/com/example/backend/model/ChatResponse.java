package com.example.backend.model;

import java.time.LocalDateTime;

public record ChatResponse(
    String reply,
    String intent,
    LocalDateTime timestamp
) {
    public static ChatResponse of(String reply, String intent) {
        return new ChatResponse(reply, intent, LocalDateTime.now());
    }
}