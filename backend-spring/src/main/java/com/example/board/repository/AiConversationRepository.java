package com.example.board.repository;

import com.example.board.domain.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {}
