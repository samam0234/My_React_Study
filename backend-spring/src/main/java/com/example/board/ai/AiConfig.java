package com.example.board.ai;

import com.example.board.config.AppProperties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    /** AI_PROVIDER 가 비어 있으면 ANTHROPIC_API_KEY 가 있을 때만 실제 모델을 쓴다. 키가 없으면 모의 구현. */
    @Bean
    AiProvider aiProvider(AppProperties props) {
        String configured = props.ai().provider() == null ? "" : props.ai().provider().trim();
        boolean hasKey = System.getenv("ANTHROPIC_API_KEY") != null && !System.getenv("ANTHROPIC_API_KEY").isBlank();
        String provider = !configured.isEmpty() ? configured : (hasKey ? "anthropic" : "mock");
        if (provider.equals("anthropic")) {
            if (!hasKey) throw new IllegalStateException("AI_PROVIDER=anthropic 이지만 ANTHROPIC_API_KEY 가 없습니다.");
            log.info("AI provider: anthropic (model={})", props.ai().model());
            return new AnthropicAiProvider(props.ai().model(), props.ai().maxTokens());
        }
        log.warn("AI provider: mock — 실제 모델을 호출하지 않습니다 (ANTHROPIC_API_KEY 없음 또는 AI_PROVIDER=mock).");
        return new MockAiProvider();
    }

    /** SSE 처리용(블로킹 호출이 많아 가상 스레드). */
    @Bean(destroyMethod = "shutdown")
    ExecutorService aiExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
