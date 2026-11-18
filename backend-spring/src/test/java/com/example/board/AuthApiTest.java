package com.example.board;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.Test;

class AuthApiTest extends ApiTestBase {

    @Test
    void 가입은_201과_user를_돌려주고_비밀번호는_해시로만_저장된다() throws Exception {
        String email = "a" + uniq() + "@example.com";
        signup(email, "password123", "mina")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.user.role").value("user"))
                .andExpect(content().string(not(containsString("password"))));
        String hash = jdbc.queryForObject("select password_hash from users where email = ?", String.class, email);
        org.junit.jupiter.api.Assertions.assertTrue(hash.startsWith("$2"), "BCrypt 해시여야 한다");
        org.junit.jupiter.api.Assertions.assertNotEquals("password123", hash);
    }

    @Test
    void 가입_검증_실패는_필드별_메시지() throws Exception {
        signup("not-an-email", "short", "a").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.fields.email").isArray())
                .andExpect(jsonPath("$.error.fields.password").isArray())
                .andExpect(jsonPath("$.error.fields.nickname").isArray());
    }

    @Test
    void 로그인은_user와_accessToken을_돌려준다() throws Exception {
        String email = "l" + uniq() + "@example.com";
        signup(email, "password123", "loginuser");
        mvc.perform(post("/api/auth/login").contentType(JSON).content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", matchesPattern("[\\w-]+\\.[\\w-]+\\.[\\w-]+")))
                .andExpect(jsonPath("$.data.user.email").value(email));
    }

    @Test
    void 로그인_실패는_없는_이메일과_틀린_비밀번호가_같은_응답() throws Exception {
        String email = "w" + uniq() + "@example.com";
        signup(email, "password123", "wrongpw");
        String a = mvc.perform(post("/api/auth/login").contentType(JSON).content("{\"email\":\"" + email + "\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                .andReturn().getResponse().getContentAsString().replaceAll("\"requestId\":\"[^\"]+\"", "");
        String b = mvc.perform(post("/api/auth/login").contentType(JSON).content("{\"email\":\"nobody" + uniq() + "@example.com\",\"password\":\"whatever123\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                .andReturn().getResponse().getContentAsString().replaceAll("\"requestId\":\"[^\"]+\"", "");
        org.junit.jupiter.api.Assertions.assertEquals(a, b);
    }

    @Test
    void 같은_계정으로_연속_실패하면_429_RATE_LIMITED() throws Exception {
        String email = "r" + uniq() + "@example.com";
        signup(email, "password123", "ratelimit");
        String bad = "{\"email\":\"" + email + "\",\"password\":\"wrong-password\"}";
        for (int i = 0; i < 5; i++) mvc.perform(post("/api/auth/login").contentType(JSON).content(bad)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(JSON).content(bad))
                .andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
        // 한도에 걸린 동안은 올바른 비밀번호로도 막힌다 (무차별 대입 방지)
        mvc.perform(post("/api/auth/login").contentType(JSON).content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void me는_토큰이_있어야_한다() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        String t = newUserToken();
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(t))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", endsWith("@example.com")));
    }

    @Test
    void 위조된_토큰과_만료된_토큰은_401() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer a.b.c")).andExpect(status().isUnauthorized());

        // 같은 시크릿으로 이미 만료된 토큰을 직접 만든다
        String t = newUserToken();
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(t))).andExpect(status().isOk());
        var key = Keys.hmacShaKeyFor("test-secret-test-secret-test-secret-0123456789".getBytes(StandardCharsets.UTF_8));
        String expired = Jwts.builder().subject("1").issuedAt(Date.from(Instant.now().minusSeconds(7200)))
                .expiration(Date.from(Instant.now().minusSeconds(3600))).signWith(key).compact();
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(expired))).andExpect(status().isUnauthorized());

        // 서명이 다른 시크릿으로 만든 토큰
        var other = Keys.hmacShaKeyFor("another-secret-another-secret-another-0123".getBytes(StandardCharsets.UTF_8));
        String forged = Jwts.builder().subject("1").expiration(Date.from(Instant.now().plusSeconds(3600))).signWith(other).compact();
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(forged))).andExpect(status().isUnauthorized());
    }

    @Test
    void 로그아웃은_로그인한_사용자에게_204() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized());
        String t = newUserToken();
        mvc.perform(post("/api/auth/logout").header("Authorization", bearer(t))).andExpect(status().isNoContent());
    }
}
