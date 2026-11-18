package com.example.board.security;

import com.example.board.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** HS256 JWT 발급·검증. 시크릿은 환경 변수(JWT_SECRET)로만 주입한다 — properties 에 고정값을 두지 않는다. */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey key;
    private final long ttlSeconds;

    public JwtService(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.isBlank()) {
            if (props.jwt().requireSecret()) {
                throw new IllegalStateException("JWT_SECRET 환경 변수가 필요합니다 (prod 프로파일).");
            }
            byte[] random = new byte[48];
            new SecureRandom().nextBytes(random);
            secret = Base64.getEncoder().encodeToString(random);
            log.warn("JWT_SECRET 이 없어 개발용 임시 키를 생성했습니다. 서버를 재시작하면 기존 토큰은 무효가 됩니다.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET 은 32바이트 이상이어야 합니다 (HS256).");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.ttlSeconds = props.jwt().ttlSeconds();
    }

    public String issue(Long userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    /** 유효한 토큰이면 사용자 id, 위조·만료면 empty. */
    public Optional<Long> verify(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(Long.parseLong(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
