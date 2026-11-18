package com.example.board.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** 필터·시큐리티 단계(컨트롤러 밖)에서 스펙 v1 오류 본문을 직접 쓴다. */
public final class ErrorWriter {
    private ErrorWriter() {}

    public static void write(HttpServletRequest request, HttpServletResponse response, int status, String code, String message)
            throws IOException {
        String requestId = (String) request.getAttribute(RequestIdFilter.ATTRIBUTE);
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        String json = "{\"error\":{\"code\":\"" + code + "\",\"message\":\"" + escape(message) + "\",\"requestId\":\""
                + (requestId == null ? "" : escape(requestId)) + "\"}}";
        response.getOutputStream().write(json.getBytes(StandardCharsets.UTF_8));
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}
