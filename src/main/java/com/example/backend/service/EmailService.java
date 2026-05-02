package com.example.backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String apiKey;

    /**
     * Sends an OTP email using the Resend API.
     * @param toEmail The recipient's email address.
     * @param otpCode The one-time password code.
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        // Initialize the Resend client with your API key
        Resend resend = new Resend(apiKey);

        // Your 'from' address. For testing, use this. For production, use a verified domain.
        String fromAddress = "onboarding@resend.dev";

        // Build the email request
        SendEmailRequest request = SendEmailRequest.builder()
                .from(fromAddress)
                .to(toEmail)
                .subject("Your OTP Code")
                .html("<p>Your OTP code is: <strong>" + otpCode + "</strong></p>")
                .build();

        try {
            resend.emails().send(request);
            System.out.println("✅ OTP email sent successfully to: " + toEmail);
        } catch (ResendException e) {
            // Log the error. The email will also appear in the Railway logs.
            System.err.println("❌ Failed to send OTP to " + toEmail + ": " + e.getMessage());
        }
    }
}
