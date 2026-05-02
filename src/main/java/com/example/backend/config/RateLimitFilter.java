package com.example.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    
    private final ConcurrentHashMap<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain)
            throws ServletException, IOException {
        
        String clientIp = getClientIP(request);
        String path = request.getRequestURI();
        String key = clientIp + ":" + path;
        
        int limit = path.contains("/api/auth/") ? MAX_LOGIN_ATTEMPTS : MAX_REQUESTS_PER_MINUTE;
        
        RequestCounter counter = requestCounts.computeIfAbsent(key, k -> new RequestCounter());
        
        if (!counter.allowRequest(limit)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0];
        }
        return request.getRemoteAddr();
    }
    
    private static class RequestCounter {
        private int count = 0;
        private long windowStart = System.currentTimeMillis();
        
        public synchronized boolean allowRequest(int maxRequests) {
            long now = System.currentTimeMillis();
            if (now - windowStart > Duration.ofMinutes(1).toMillis()) {
                count = 0;
                windowStart = now;
            }
            if (count >= maxRequests) return false;
            count++;
            return true;
        }
    }
}