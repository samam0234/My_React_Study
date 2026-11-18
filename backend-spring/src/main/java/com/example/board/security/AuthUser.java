package com.example.board.security;

/** SecurityContext 의 principal. 컨트롤러는 @AuthenticationPrincipal 로 받는다. */
public record AuthUser(Long id, String email, String nickname, String role) {
    public boolean isAdmin() {
        return "admin".equals(role);
    }
}
