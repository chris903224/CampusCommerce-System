package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class ChatRepository {
    
    private final JdbcTemplate jdbcTemplate;
    
    public ChatRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    private final RowMapper<ChatMessage> rowMapper = (rs, rowNum) -> new ChatMessage(
        rs.getLong("id"),
        rs.getLong("user_id"),
        rs.getString("user_message"),
        rs.getString("bot_response"),
        rs.getString("intent_detected"),
        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
    );
    
    public void save(ChatMessage message) {
        String sql = "INSERT INTO chat_messages (user_id, user_message, bot_response, intent_detected, created_at) " +
                     "VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
            message.userId(),
            message.userMessage(),
            message.botResponse(),
            message.intentDetected(),
            LocalDateTime.now()
        );
    }
    
    public List<ChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId) {
        String sql = "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper, userId);
    }
    
    public List<ChatMessage> findByUserIdAndIntentDetected(Long userId, String intent) {
        String sql = "SELECT * FROM chat_messages WHERE user_id = ? AND intent_detected = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper, userId, intent);
    }
}