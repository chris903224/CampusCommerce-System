package com.example.backend.controller;

import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatRequest;
import com.example.backend.model.ChatResponse;
import com.example.backend.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {
    
    private final ChatbotService chatbotService;
    
    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }
    
    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = chatbotService.processMessage(request.message(), request.userId());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(chatbotService.getChatHistory(userId));
    }
}