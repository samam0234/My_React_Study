package com.example.board.security;

import com.example.board.config.AppProperties;
import jakarta.servlet.DispatcherType;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/** Spring Security + JWT. 세션 STATELESS, CSRF 비활성(Bearer 헤더 방식), BCrypt, 오류 응답은 스펙 v1 JSON. */
@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // SSE(SseEmitter) 완료 시의 비동기·오류 디스패치는 다시 인증하지 않는다
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 로그인이 필요한 곳을 명시한다. 그 밖의 알 수 없는 경로는 404(스펙: NOT_FOUND)가 나오도록 막지 않는다.
                        .requestMatchers("/api/auth/logout", "/api/auth/me").authenticated()
                        .requestMatchers("/api/ai/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/posts", "/api/posts/*/comments").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/posts/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/*", "/api/comments/*").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                ErrorWriter.write(req, res, 401, "UNAUTHORIZED", "토큰이 없거나 만료되었습니다."))
                        .accessDeniedHandler((req, res, ex) ->
                                ErrorWriter.write(req, res, 403, "FORBIDDEN", "권한이 없습니다.")))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** 스펙 v1 §7: 허용 출처는 환경 변수 CORS_ORIGIN (개발: http://localhost:5173). 와일드카드는 쓰지 않는다. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(props.cors().origins());
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
        config.setExposedHeaders(List.of("X-Request-Id", "Location"));
        config.setMaxAge(600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
