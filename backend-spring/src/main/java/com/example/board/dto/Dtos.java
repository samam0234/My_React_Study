package com.example.board.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/** 공통 API 스펙 v1 의 요청·응답 모양. 엔티티는 응답에 그대로 노출하지 않는다(DTO 로만). 필드는 camelCase. */
public final class Dtos {
    private Dtos() {}

    // ---------- 응답 ----------
    public record DataResponse<T>(T data) {}

    public record Meta(int page, int limit, long total, int totalPages, String q) {}

    public record PageResponse<T>(List<T> data, Meta meta) {}

    public record AuthorDto(Long id, String nickname) {}

    public record UserDto(Long id, String email, String nickname, String role) {}

    public record LoginResult(UserDto user, String accessToken) {}

    public record SignupResult(UserDto user) {}

    public record PostSummaryDto(Long id, String title, AuthorDto author, long commentCount, Instant createdAt) {}

    public record PostDetailDto(
            Long id,
            String title,
            String body,
            List<String> tags,
            AuthorDto author,
            long commentCount,
            Instant createdAt,
            Instant updatedAt) {}

    public record CommentDto(Long id, Long postId, String body, AuthorDto author, Instant createdAt) {}

    // ---------- 요청 ----------
    public record SignupRequest(
            @NotBlank(message = "이메일을 입력하세요.")
                    @Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "올바른 이메일 형식이 아닙니다.")
                    String email,
            @NotBlank(message = "비밀번호를 입력하세요.") @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
                    String password,
            @NotBlank(message = "닉네임은 2~20자로 입력하세요.") @Size(min = 2, max = 20, message = "닉네임은 2~20자로 입력하세요.")
                    String nickname) {}

    public record LoginRequest(@NotBlank(message = "이메일을 입력하세요.") String email, @NotBlank(message = "비밀번호를 입력하세요.") String password) {}

    public record PostCreateRequest(
            @NotBlank(message = "1~200자로 입력하세요.") @Size(max = 200, message = "1~200자로 입력하세요.") String title,
            @NotBlank(message = "1~10000자로 입력하세요.") @Size(max = 10000, message = "1~10000자로 입력하세요.") String body,
            @Size(max = 10, message = "태그는 10개 이하여야 합니다.") List<@Size(max = 20, message = "태그는 20자 이하여야 합니다.") String> tags) {}

    /** PATCH: 보낸 필드만 수정한다(null 이면 그대로). 보냈다면 형식은 생성과 같다. */
    public record PostUpdateRequest(
            @Size(min = 1, max = 200, message = "1~200자로 입력하세요.") String title,
            @Size(min = 1, max = 10000, message = "1~10000자로 입력하세요.") String body,
            @Size(max = 10, message = "태그는 10개 이하여야 합니다.") List<@Size(max = 20, message = "태그는 20자 이하여야 합니다.") String> tags) {}

    public record CommentCreateRequest(
            @NotBlank(message = "1~1000자로 입력하세요.") @Size(max = 1000, message = "1~1000자로 입력하세요.") String body) {}

    // ---------- AI ----------
    public record ChatMessage(
            @NotBlank @Pattern(regexp = "user|assistant", message = "role 은 user 또는 assistant 여야 합니다.") String role,
            @NotBlank(message = "내용을 입력하세요.") @Size(max = 8000, message = "메시지는 8000자 이하여야 합니다.") String content) {}

    public record ChatRequest(
            @NotEmpty(message = "messages 가 필요합니다.") @Size(max = 40, message = "messages 는 40개 이하여야 합니다.") List<@Valid ChatMessage> messages) {}

    public record Usage(int inputTokens, int outputTokens) {}

    public record ChatResult(String text) {}

    public record ChatMeta(Usage usage) {}

    public record ChatResponse(ChatResult data, ChatMeta meta) {}
}
