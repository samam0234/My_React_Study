package com.example.board.config;

import com.example.board.domain.Comment;
import com.example.board.domain.Post;
import com.example.board.domain.User;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** APP_SEED=true 일 때만 데모 데이터를 넣는다 (users 가 비어 있을 때 1회). 운영에서는 켜지 않는다. */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final UserRepository users;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final PasswordEncoder encoder;

    public SeedRunner(UserRepository users, PostRepository posts, CommentRepository comments, PasswordEncoder encoder) {
        this.users = users;
        this.posts = posts;
        this.comments = comments;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) return;
        String pw = encoder.encode("password123");
        User mina = users.save(new User("mina@example.com", "mina", pw, "user"));
        User jun = users.save(new User("jun@example.com", "jun", pw, "user"));
        users.save(new User("admin@example.com", "admin", pw, "admin"));

        Post last = null;
        for (int i = 1; i <= 25; i++) {
            Post p = new Post(i % 2 == 1 ? mina : jun, "샘플 글 " + i, "샘플 글 " + i + "의 본문입니다. React와 공통 API 스펙 v1 연습용 데이터입니다.", List.of("sample"));
            p.setCreatedAt(Instant.now().minus(26 - i, ChronoUnit.HOURS));
            last = posts.save(p);
        }
        comments.save(new Comment(last, jun, "첫 댓글입니다."));
        log.info("시드 데이터를 넣었습니다: mina/jun/admin@example.com (비밀번호 password123), 글 25개");
    }
}
