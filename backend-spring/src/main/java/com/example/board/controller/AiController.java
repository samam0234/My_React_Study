package com.example.board.controller;

import com.example.board.dto.Dtos.ChatRequest;
import com.example.board.dto.Dtos.ChatResponse;
import com.example.board.security.AuthUser;
import com.example.board.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

/** 노션 "AI 모델 연동 · MCP": JWT 로 보호된 POST /api/ai/chat, /api/ai/chat/stream. 모델 API 키는 서버만 안다. */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody ChatRequest req) {
        return ai.chat(me, req);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<ResponseBodyEmitter> stream(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody ChatRequest req) {
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_EVENT_STREAM, java.nio.charset.StandardCharsets.UTF_8)) // 한글이 깨지지 않게 UTF-8 명시
                .header("Cache-Control", "no-cache")
                .header("X-Accel-Buffering", "no") // Nginx 가 응답을 모아서 보내지 않게
                .body(ai.stream(me, req));
    }
}
