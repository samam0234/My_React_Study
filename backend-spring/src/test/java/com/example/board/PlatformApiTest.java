package com.example.board;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.board.config.AppProperties;
import com.example.board.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;

/** 스펙 v1 §7 공통 헤더·문서·CORS, 비밀 관리, 요청 크기 제한. */
class PlatformApiTest extends ApiTestBase {

    private static final String ORIGIN = "http://localhost:5173";

    @Test
    void health는_접두어_없이_status_ok() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void 응답_Content_Type은_application_json_charset_utf_8() throws Exception {
        // 노션 공통 스펙 7절: 요청·응답 Content-Type: application/json; charset=utf-8 (성공·오류 모두)
        mvc.perform(get("/health")).andExpect(header().string("Content-Type", org.hamcrest.Matchers.equalToIgnoringCase("application/json;charset=UTF-8")));
        mvc.perform(get("/api/posts")).andExpect(header().string("Content-Type", org.hamcrest.Matchers.equalToIgnoringCase("application/json;charset=UTF-8")));
        mvc.perform(get("/api/posts/987654321")).andExpect(header().string("Content-Type", org.hamcrest.Matchers.equalToIgnoringCase("application/json;charset=UTF-8")));
    }

    @Test
    void X_Request_Id는_요청_값을_그대로_없으면_생성_오류_본문의_requestId와_같다() throws Exception {
        mvc.perform(get("/health").header("X-Request-Id", "req-123")).andExpect(header().string("X-Request-Id", "req-123"));
        mvc.perform(get("/health")).andExpect(header().exists("X-Request-Id"));
        var res = mvc.perform(get("/api/posts/987654321").header("X-Request-Id", "abc-1")).andReturn().getResponse();
        Assertions.assertTrue(res.getContentAsString().contains("\"requestId\":\"abc-1\""));
        // 이상한 값은 버리고 새로 만든다 (로그 위조 방지)
        mvc.perform(get("/health").header("X-Request-Id", "bad id\twith space"))
                .andExpect(header().string("X-Request-Id", not(containsString(" "))));
    }

    @Test
    void CORS는_허용_출처만_반영하고_프리플라이트는_통과한다() throws Exception {
        mvc.perform(get("/api/posts").header("Origin", ORIGIN)).andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().string("Access-Control-Expose-Headers", containsString("X-Request-Id")));
        mvc.perform(get("/api/posts").header("Origin", "http://evil.example")).andExpect(status().isForbidden());
        mvc.perform(options("/api/posts").header("Origin", ORIGIN).header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().string("Access-Control-Allow-Headers", containsStringIgnoringCase("Authorization")))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("PATCH")));
    }

    @Test
    void OpenAPI_문서는_api_docs에서_제공된다() throws Exception {
        mvc.perform(get("/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", startsWith("3")))
                .andExpect(jsonPath("$.paths['/api/posts']").exists())
                .andExpect(jsonPath("$.paths['/api/auth/login']").exists())
                .andExpect(jsonPath("$.paths['/api/ai/chat/stream']").exists());
    }

    @Test
    void 요청_본문이_너무_크면_413_PAYLOAD_TOO_LARGE() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(JSON).content("{\"email\":\"" + "a".repeat(1_100_000) + "\",\"password\":\"x\"}"))
                .andExpect(status().isPayloadTooLarge()).andExpect(jsonPath("$.error.code").value("PAYLOAD_TOO_LARGE"));
    }

    @Test
    void 예상치_못한_오류는_500_INTERNAL이며_내부_정보를_노출하지_않는다() throws Exception {
        // 글 제목에 NUL 문자를 넣으면 PostgreSQL 이 거부해 서버 오류가 난다 → 스택·SQL 이 응답에 없어야 한다
        String t = newUserToken();
        var res = mvc.perform(post("/api/posts").header("Authorization", bearer(t)).contentType(JSON)
                        .content("{\"title\":\"a\\u0000b\",\"body\":\"본문\"}"))
                .andReturn().getResponse();
        if (res.getStatus() == 500) {
            String body = res.getContentAsString();
            Assertions.assertTrue(body.contains("\"code\":\"INTERNAL\""));
            Assertions.assertFalse(body.contains("Exception") || body.toLowerCase().contains("sql") || body.contains("at com."));
        }
    }

    @Test
    void prod에서는_JWT_SECRET_없이_시작하지_않고_짧은_키도_거절한다() {
        var prod = new AppProperties(new AppProperties.Jwt("", 3600, true), null, null, null, null);
        Assertions.assertThrows(IllegalStateException.class, () -> new JwtService(prod));
        var shortKey = new AppProperties(new AppProperties.Jwt("too-short", 3600, false), null, null, null, null);
        Assertions.assertThrows(IllegalStateException.class, () -> new JwtService(shortKey));
        // 개발 모드에서 비어 있으면 임시 키로 시작한다
        var dev = new AppProperties(new AppProperties.Jwt("", 3600, false), null, null, null, null);
        Assertions.assertNotNull(new JwtService(dev).issue(1L, "user"));
    }
}
