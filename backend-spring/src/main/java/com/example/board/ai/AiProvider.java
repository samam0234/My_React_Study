package com.example.board.ai;

import java.util.List;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;

/** 모델 호출 추상화. 구현: AnthropicAiProvider(실제), MockAiProvider(키 없이 개발·테스트). AI_PROVIDER 로 고른다. */
public interface AiProvider {

    record Message(String role, String content) {}

    /**
     * @param refusal 안전 분류기가 거절함 (stop_reason = refusal)
     * @param truncated max_tokens 에서 잘림
     */
    record Result(String text, int inputTokens, int outputTokens, boolean refusal, boolean truncated) {}

    Result chat(List<Message> messages);

    /** 글자가 생성되는 대로 onText 로 넘기고, 연결이 끊겨 cancelled 가 true 가 되면 즉시 중단한다. */
    Result stream(List<Message> messages, Consumer<String> onText, BooleanSupplier cancelled);
}
