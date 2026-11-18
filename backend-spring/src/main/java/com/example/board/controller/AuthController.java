package com.example.board.controller;

import com.example.board.dto.Dtos.DataResponse;
import com.example.board.dto.Dtos.LoginRequest;
import com.example.board.dto.Dtos.LoginResult;
import com.example.board.dto.Dtos.SignupRequest;
import com.example.board.dto.Dtos.SignupResult;
import com.example.board.dto.Dtos.UserDto;
import com.example.board.security.AuthUser;
import com.example.board.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/signup")
    public ResponseEntity<DataResponse<SignupResult>> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(new SignupResult(auth.signup(req))));
    }

    @PostMapping("/login")
    public DataResponse<LoginResult> login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return new DataResponse<>(auth.login(req, http.getRemoteAddr()));
    }

    /** 토큰(Bearer) 방식이라 서버가 지울 세션이 없다 — 204 만 돌려주고 클라이언트가 토큰을 버린다. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public DataResponse<UserDto> me(@AuthenticationPrincipal AuthUser me) {
        return new DataResponse<>(auth.me(me.id()));
    }
}
