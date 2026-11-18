package com.example.board.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_conversations")
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 200)
    private String title;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected AiConversation() {}

    public AiConversation(Long userId, String title) {
        this.userId = userId;
        this.title = title;
    }

    public Long getId() { return id; }
}
