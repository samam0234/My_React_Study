package com.example.board;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.jayway.jsonpath.JsonPath;

/**
 * 통합 테스트 공통 기반. 노션 "테스트 기초"의 "테스트 DB 분리(Testcontainers)": 실제 PostgreSQL 16 컨테이너 하나를
 * 모든 테스트 클래스가 공유하고(Flyway 마이그레이션 적용), 테스트마다 고유한 이메일을 써서 서로 간섭하지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestBase {

    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;

    protected static String uniq() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    protected static final String JSON = MediaType.APPLICATION_JSON_VALUE;

    protected ResultActions signup(String email, String password, String nickname) throws Exception {
        return mvc.perform(post("/api/auth/signup").contentType(JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"nickname\":\"" + nickname + "\"}"));
    }

    /** 가입 + 로그인해서 accessToken 을 돌려준다. */
    protected String newUserToken() throws Exception {
        String email = "u" + uniq() + "@example.com";
        signup(email, "password123", "user" + uniq().substring(0, 4)).andReturn();
        return login(email, "password123");
    }

    protected String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.accessToken");
    }

    /** 관리자(role=admin)는 가입 API 로 만들 수 없으므로 DB 에 직접 승격한다. */
    protected String newAdminToken() throws Exception {
        String email = "admin" + uniq() + "@example.com";
        signup(email, "password123", "admin" + uniq().substring(0, 3)).andReturn();
        jdbc.update("update users set role = 'admin' where email = ?", email);
        return login(email, "password123");
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    protected long createPost(String token, String title, String body) throws Exception {
        String res = mvc.perform(post("/api/posts").header("Authorization", bearer(token)).contentType(JSON)
                        .content("{\"title\":\"" + title + "\",\"body\":\"" + body + "\",\"tags\":[\"t1\"]}"))
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(res, "$.data.id")).longValue();
    }

    protected ResultActions getPosts(String query) throws Exception {
        return mvc.perform(get("/api/posts" + query));
    }
}
