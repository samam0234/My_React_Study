package com.example.board.security;

import com.example.board.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** 스펙 v1 §5: 413 PAYLOAD_TOO_LARGE. 본문이 너무 큰 요청은 읽기 전에 거절한다. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class PayloadSizeFilter extends OncePerRequestFilter {

    private final long max;

    public PayloadSizeFilter(AppProperties props) {
        this.max = props.limits().maxBodyBytes();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > max) {
            ErrorWriter.write(request, response, 413, "PAYLOAD_TOO_LARGE", "요청 본문이 너무 큽니다.");
            return;
        }
        chain.doFilter(request, response);
    }
}
