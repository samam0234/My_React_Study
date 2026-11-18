package com.example.board.service;

import com.example.board.config.AppProperties;
import com.example.board.domain.User;
import com.example.board.dto.Dtos.LoginRequest;
import com.example.board.dto.Dtos.LoginResult;
import com.example.board.dto.Dtos.SignupRequest;
import com.example.board.dto.Dtos.UserDto;
import com.example.board.exception.ApiException;
import com.example.board.repository.UserRepository;
import com.example.board.security.JwtService;
import java.time.Duration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RateLimiter failedLogins;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        // 무차별 대입 방지: 같은 (IP, 이메일)로 1분에 N번까지만 실패할 수 있다 (노션 "웹 보안 기초": 로그인 시도 제한)
        this.failedLogins = new RateLimiter(props.limits().loginAttemptsPerMinute(), Duration.ofMinutes(1));
    }

    public static UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getNickname(), u.getRole());
    }

    @Transactional
    public UserDto signup(SignupRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw ApiException.emailTaken();
        try {
            // 비밀번호는 BCrypt 해시로만 저장하고 응답 어디에도 넣지 않는다
            return toDto(users.saveAndFlush(new User(email, req.nickname().trim(), encoder.encode(req.password()), "user")));
        } catch (DataIntegrityViolationException e) {
            throw ApiException.emailTaken(); // 동시 가입 경쟁 상태(UNIQUE 위반)
        }
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest req, String clientIp) {
        String email = req.email().trim().toLowerCase();
        String key = clientIp + "|" + email;
        if (failedLogins.isBlocked(key)) throw ApiException.rateLimited("로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.");

        // 없는 이메일과 틀린 비밀번호를 같은 응답으로 (계정 열거 방지)
        User user = users.findByEmail(email).orElse(null);
        if (user == null || !encoder.matches(req.password(), user.getPasswordHash())) {
            failedLogins.tryAcquire(key);
            throw ApiException.invalidCredentials();
        }
        failedLogins.reset(key);
        return new LoginResult(toDto(user), jwt.issue(user.getId(), user.getRole()));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long userId) {
        return users.findById(userId).map(AuthService::toDto).orElseThrow(() -> ApiException.unauthorized("토큰이 없거나 만료되었습니다."));
    }
}
