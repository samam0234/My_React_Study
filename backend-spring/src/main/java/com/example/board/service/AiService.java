package com.example.board.service;

import com.example.board.ai.AiProvider;
import com.example.board.ai.AiProvider.Message;
import com.example.board.ai.AiProvider.Result;
import com.example.board.config.AppProperties;
import com.example.board.domain.AiConversation;
import com.example.board.domain.AiMessage;
import com.example.board.dto.Dtos.ChatMessage;
import com.example.board.dto.Dtos.ChatMeta;
import com.example.board.dto.Dtos.ChatRequest;
import com.example.board.dto.Dtos.ChatResponse;
import com.example.board.dto.Dtos.ChatResult;
import com.example.board.dto.Dtos.Usage;
import com.example.board.exception.ApiException;
import com.example.board.repository.AiConversationRepository;
import com.example.board.repository.AiMessageRepository;
import com.example.board.security.AuthUser;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

/**
 * 노션 "AI 모델 연동 · MCP": JWT 확인(컨트롤러/시큐리티) → 사용자별 한도 확인 → 서버 환경 변수의 키로 모델 호출 → 공통 스펙으로 응답.
 * 사용량(토큰)은 DB 에 남기고, 오늘 사용량이 AI_DAILY_TOKEN_LIMIT 를 넘으면 429 AI_QUOTA_EXCEEDED.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final String REFUSAL_TEXT = "이 요청에는 답할 수 없습니다.";
    private static final String UNAVAILABLE = "잠시 후 다시 시도해 주세요";

    private final AiProvider provider;
    private final AiConversationRepository conversations;
    private final AiMessageRepository messages;
    private final ExecutorService executor;
    private final AppProperties.Ai config;
    private final RateLimiter requestLimiter;

    public AiService(AiProvider provider, AiConversationRepository conversations, AiMessageRepository messages, ExecutorService aiExecutor, AppProperties props) {
        this.provider = provider;
        this.conversations = conversations;
        this.messages = messages;
        this.executor = aiExecutor;
        this.config = props.ai();
        this.requestLimiter = new RateLimiter(props.ai().requestsPerMinute(), Duration.ofMinutes(1));
    }

    private static List<Message> toMessages(ChatRequest req) {
        return req.messages().stream().map(m -> new Message(m.role(), m.content())).toList();
    }

    /** 요청을 받기 전에 확인한다: 입력 검증(마지막은 user) → 속도 제한 → 일일 토큰 한도. 실패는 일반 JSON 오류(SSE 시작 전). */
    private void guard(AuthUser me, ChatRequest req) {
        // 프론트가 보낸 대화를 그대로 믿지 않는다: 길이·개수 제한은 DTO 검증, 마지막 메시지는 user 여야 한다
        ChatMessage last = req.messages().get(req.messages().size() - 1);
        if (!"user".equals(last.role())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "입력값을 확인하세요.",
                    java.util.Map.of("messages", List.of("마지막 메시지는 user 여야 합니다.")));
        }
        if (!requestLimiter.tryAcquire(String.valueOf(me.id()))) {
            throw ApiException.rateLimited("요청이 너무 많습니다. 잠시 후 다시 시도하세요.");
        }
        var since = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        if (this.messages.sumTokensSince(me.id(), since) >= config.dailyTokenLimit()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_QUOTA_EXCEEDED", "오늘의 AI 사용량 한도를 넘었습니다.");
        }
    }

    public ChatResponse chat(AuthUser me, ChatRequest req) {
        guard(me, req);
        Result r;
        try {
            r = provider.chat(toMessages(req));
        } catch (RuntimeException e) {
            log.error("AI 호출 실패", e); // 내부 원인은 로그에만
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_UNAVAILABLE", UNAVAILABLE);
        }
        if (r.refusal()) return new ChatResponse(new ChatResult(REFUSAL_TEXT), null);
        saveUsage(me.id(), req, r);
        return new ChatResponse(new ChatResult(r.text()), new ChatMeta(new Usage(r.inputTokens(), r.outputTokens())));
    }

    /** SSE: `data: {"text":"…"}` 조각들 + `data: [DONE]`. 오류는 `data: {"error":{"code","message"}}`. */
    public ResponseBodyEmitter stream(AuthUser me, ChatRequest req) {
        guard(me, req);
        ResponseBodyEmitter emitter = new ResponseBodyEmitter(120_000L);
        AtomicBoolean cancelled = new AtomicBoolean(false);
        emitter.onCompletion(() -> cancelled.set(true));
        emitter.onTimeout(() -> cancelled.set(true));
        emitter.onError(e -> cancelled.set(true));

        executor.submit(() -> {
            try {
                Result r = provider.stream(toMessages(req), text -> send(emitter, "{\"text\":" + Json.quote(text) + "}", cancelled), cancelled::get);
                if (r.refusal()) send(emitter, "{\"text\":" + Json.quote(REFUSAL_TEXT) + "}", cancelled);
                else saveUsage(me.id(), req, r);
                if (r.truncated()) send(emitter, "{\"error\":{\"code\":\"AI_TRUNCATED\",\"message\":\"답변이 길어 중간에 잘렸습니다.\"}}", cancelled);
                send(emitter, "[DONE]", cancelled);
                emitter.complete();
            } catch (CancelledException e) {
                emitter.complete(); // 클라이언트가 떠남 — 조용히 종료
            } catch (Exception e) {
                if (!cancelled.get()) {
                    log.error("AI 스트리밍 실패", e);
                    try {
                        send(emitter, "{\"error\":{\"code\":\"AI_UNAVAILABLE\",\"message\":" + Json.quote(UNAVAILABLE) + "}}", cancelled);
                        send(emitter, "[DONE]", cancelled);
                    } catch (RuntimeException ignored) {
                        // 이미 끊김
                    }
                }
                emitter.complete();
            }
        });
        return emitter;
    }

    private static void send(ResponseBodyEmitter emitter, String json, AtomicBoolean cancelled) {
        if (cancelled.get()) throw new CancelledException();
        try {
            emitter.send("data: " + json + "\n\n");
        } catch (IOException | IllegalStateException e) {
            cancelled.set(true);
            throw new CancelledException();
        }
    }

    private static final class CancelledException extends RuntimeException {
        CancelledException() {
            super(null, null, false, false);
        }
    }

    @Transactional
    public void saveUsage(Long userId, ChatRequest req, Result r) {
        String firstUser = req.messages().stream().filter(m -> "user".equals(m.role())).findFirst().map(ChatMessage::content).orElse("");
        AiConversation conv = conversations.save(new AiConversation(userId, firstUser.substring(0, Math.min(30, firstUser.length()))));
        ChatMessage last = req.messages().get(req.messages().size() - 1);
        messages.save(new AiMessage(conv.getId(), "user", last.content(), null, null));
        messages.save(new AiMessage(conv.getId(), "assistant", r.text(), r.inputTokens(), r.outputTokens()));
    }
}
