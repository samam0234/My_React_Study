package com.example.board.exception;

import com.example.board.security.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 모든 4xx·5xx 를 스펙 v1 §5 형식으로 통일한다:
 * { "error": { "code", "message", "fields"?, "requestId" } }
 * 500 은 스택·예외 원문을 응답에 넣지 않고 로그에만 남긴다 (코드 INTERNAL).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ErrorBody(Detail error) {}

    public record Detail(String code, String message, Map<String, List<String>> fields, String requestId) {}

    private static ResponseEntity<ErrorBody> body(
            HttpStatus status, String code, String message, Map<String, List<String>> fields, HttpServletRequest req) {
        String requestId = (String) req.getAttribute(RequestIdFilter.ATTRIBUTE);
        return ResponseEntity.status(status).body(new ErrorBody(new Detail(code, message, fields, requestId)));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException e, HttpServletRequest req) {
        return body(e.getStatus(), e.getCode(), e.getMessage(), e.getFields(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException e, HttpServletRequest req) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fe -> {
            // "messages[0].content" 같은 중첩 경로는 그대로 키로 쓴다
            fields.computeIfAbsent(fe.getField(), k -> new ArrayList<>()).add(fe.getDefaultMessage());
        });
        return body(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "입력값을 확인하세요.", fields, req);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorBody> handleBadRequest(Exception e, HttpServletRequest req) {
        String message = e instanceof MethodArgumentTypeMismatchException ? "요청 값의 형식이 올바르지 않습니다." : "JSON 문법 오류입니다.";
        return body(HttpStatus.BAD_REQUEST, "BAD_REQUEST", message, null, req);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorBody> handleDenied(AccessDeniedException e, HttpServletRequest req) {
        return body(HttpStatus.FORBIDDEN, "FORBIDDEN", "권한이 없습니다.", null, req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorBody> handleNoResource(NoResourceFoundException e, HttpServletRequest req) {
        return body(HttpStatus.NOT_FOUND, "NOT_FOUND", "없는 경로입니다.", null, req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorBody> handleMethod(HttpRequestMethodNotSupportedException e, HttpServletRequest req) {
        return body(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "허용되지 않는 메소드입니다.", null, req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleUnexpected(Exception e, HttpServletRequest req) {
        String requestId = (String) req.getAttribute(RequestIdFilter.ATTRIBUTE);
        log.error("[{}] 처리되지 않은 오류", requestId, e); // 스택은 로그에만
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL", "서버 오류가 발생했습니다.", null, req);
    }
}
