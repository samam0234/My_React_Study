package com.example.board.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_messages")
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected AiMessage() {}

    public AiMessage(Long conversationId, String role, String content, Integer inputTokens, Integer outputTokens) {
        this.conversationId = conversationId;
        this.role = role;
        this.content = content;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
    }
}
