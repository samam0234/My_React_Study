package com.example.board;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** 노션 §5·§9: 사용자별 일일 토큰 한도(429 AI_QUOTA_EXCEEDED)와 요청 속도 제한(429 RATE_LIMITED). */
@TestPropertySource(properties = {"app.ai.daily-token-limit=30", "app.ai.requests-per-minute=3"})
class AiLimitsTest extends ApiTestBase {

    private static String body(String content) {
        return "{\"messages\":[{\"role\":\"user\",\"content\":\"" + content + "\"}]}";
    }

    @Test
    void 오늘_사용량이_한도를_넘으면_429_AI_QUOTA_EXCEEDED() throws Exception {
        String t = newUserToken();
        // 첫 요청은 통과, 입력/출력 토큰이 한도(30)를 넘기게 긴 문장을 보낸다
        mvc.perform(post("/api/ai/chat").header("Authorization", bearer(t)).contentType(JSON).content(body("가".repeat(200)))).andExpect(status().isOk());
        mvc.perform(post("/api/ai/chat").header("Authorization", bearer(t)).contentType(JSON).content(body("다음 질문")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("AI_QUOTA_EXCEEDED"));
        // 한도는 사용자별이다 — 다른 사용자는 영향이 없다
        String other = newUserToken();
        mvc.perform(post("/api/ai/chat").header("Authorization", bearer(other)).contentType(JSON).content(body("안녕"))).andExpect(status().isOk());
    }

    @Test
    void 분당_요청_수를_넘으면_429_RATE_LIMITED() throws Exception {
        String t = newUserToken();
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/ai/chat").header("Authorization", bearer(t)).contentType(JSON).content(body("짧게"))).andExpect(status().isOk());
        }
        mvc.perform(post("/api/ai/chat").header("Authorization", bearer(t)).contentType(JSON).content(body("짧게")))
                .andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }
}
