package com.example.board;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;

/** 노션 "테스트 기초"의 "게시판 API 테스트 체크리스트(공통 스펙 기준)" 7개 + 스펙 v1 §3·§4 세부. */
class PostApiTest extends ApiTestBase {

    // ---------- 체크리스트 7개 ----------

    @Test
    void 목록은_200_data배열_meta를_돌려준다() throws Exception {
        String t = newUserToken();
        createPost(t, "목록확인" + uniq(), "본문");
        getPosts("").andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.meta.page").value(1))
                .andExpect(jsonPath("$.meta.limit").value(10))
                .andExpect(jsonPath("$.meta.total", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.meta.totalPages", greaterThanOrEqualTo(1)));
    }

    @Test
    void 없는_id는_404_NOT_FOUND() throws Exception {
        mvc.perform(get("/api/posts/987654321")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.error.requestId").isNotEmpty());
    }

    @Test
    void 토큰_없이_작성하면_401() throws Exception {
        mvc.perform(post("/api/posts").contentType(JSON).content("{\"title\":\"a\",\"body\":\"b\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void 제목이_비면_400_VALIDATION_ERROR_fields_title() throws Exception {
        String t = newUserToken();
        mvc.perform(post("/api/posts").header("Authorization", bearer(t)).contentType(JSON).content("{\"title\":\"\",\"body\":\"본문\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.fields.title[0]").isNotEmpty())
                .andExpect(jsonPath("$.error.requestId").isNotEmpty());
    }

    @Test
    void 남의_글을_수정하면_403() throws Exception {
        String owner = newUserToken();
        String other = newUserToken();
        long id = createPost(owner, "내글" + uniq(), "본문");
        mvc.perform(patch("/api/posts/" + id).header("Authorization", bearer(other)).contentType(JSON).content("{\"title\":\"해킹\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void 중복_이메일_가입은_409_EMAIL_TAKEN() throws Exception {
        String email = "dup" + uniq() + "@example.com";
        signup(email, "password123", "dupuser").andExpect(status().isCreated());
        signup(email, "password123", "dupuser2").andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_TAKEN"));
    }

    @Test
    void 삭제는_204이고_다시_조회하면_404() throws Exception {
        String t = newUserToken();
        long id = createPost(t, "삭제대상" + uniq(), "본문");
        mvc.perform(delete("/api/posts/" + id).header("Authorization", bearer(t))).andExpect(status().isNoContent())
                .andExpect(content().string(""));
        mvc.perform(get("/api/posts/" + id)).andExpect(status().isNotFound());
    }

    // ---------- 스펙 v1 세부 ----------

    @Test
    void 작성하면_201_Location_헤더_data_응답에_비밀번호가_없다() throws Exception {
        String t = newUserToken();
        var res = mvc.perform(post("/api/posts").header("Authorization", bearer(t)).contentType(JSON)
                        .content("{\"title\":\"첫 글\",\"body\":\"안녕하세요\",\"tags\":[\"intro\"]}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", matchesPattern("/api/posts/\\d+")))
                .andExpect(jsonPath("$.data.title").value("첫 글"))
                .andExpect(jsonPath("$.data.tags[0]").value("intro"))
                .andExpect(jsonPath("$.data.author.nickname").isNotEmpty())
                .andExpect(jsonPath("$.data.commentCount").value(0))
                .andExpect(jsonPath("$.data.createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T.*Z"))) // ISO 8601 UTC
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(res.toLowerCase().contains("password"));
    }

    @Test
    void limit은_50을_넘으면_50으로_page는_1부터() throws Exception {
        getPosts("?limit=999&page=0").andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.limit").value(50))
                .andExpect(jsonPath("$.meta.page").value(1));
    }

    @Test
    void 잘못된_sort는_400_BAD_REQUEST() throws Exception {
        getPosts("?sort=title").andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void q검색은_대소문자를_무시하고_meta에_q를_담는다_와일드카드는_문자로_취급() throws Exception {
        String t = newUserToken();
        String key = "Zebra" + uniq();
        createPost(t, key + " 제목", "본문");
        getPosts("?q=" + key.toLowerCase()).andExpect(jsonPath("$.meta.total").value(1)).andExpect(jsonPath("$.meta.q").value(key.toLowerCase()));
        getPosts("?q=%25").andExpect(status().isOk()); // '%' 만 검색해도 전체가 걸리지 않는다 (LIKE 와일드카드 이스케이프)
        getPosts("?q=%25").andExpect(jsonPath("$.meta.total", lessThan(1000)));
    }

    @Test
    void 댓글_많은순_정렬() throws Exception {
        String t = newUserToken();
        String key = "정렬" + uniq();
        long a = createPost(t, key + "A", "본문");
        long b = createPost(t, key + "B", "본문");
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/posts/" + b + "/comments").header("Authorization", bearer(t)).contentType(JSON).content("{\"body\":\"c\"}"));
        }
        getPosts("?q=" + key + "&sort=-commentCount")
                .andExpect(jsonPath("$.data[0].id").value((int) b))
                .andExpect(jsonPath("$.data[0].commentCount").value(2))
                .andExpect(jsonPath("$.data[1].id").value((int) a));
    }

    @Test
    void PATCH는_보낸_필드만_바꾼다() throws Exception {
        String t = newUserToken();
        long id = createPost(t, "원래제목" + uniq(), "원래본문");
        mvc.perform(patch("/api/posts/" + id).header("Authorization", bearer(t)).contentType(JSON).content("{\"body\":\"새 본문\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.body").value("새 본문"))
                .andExpect(jsonPath("$.data.title", startsWith("원래제목")));
    }

    @Test
    void 관리자는_남의_글을_삭제할_수_있지만_수정은_못한다() throws Exception {
        String owner = newUserToken();
        String admin = newAdminToken();
        long id = createPost(owner, "관리대상" + uniq(), "본문");
        mvc.perform(patch("/api/posts/" + id).header("Authorization", bearer(admin)).contentType(JSON).content("{\"title\":\"수정\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/posts/" + id).header("Authorization", bearer(admin))).andExpect(status().isNoContent());
    }

    @Test
    void 숫자가_아닌_id와_깨진_JSON은_400_없는_경로는_404() throws Exception {
        mvc.perform(get("/api/posts/abc")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
        String t = newUserToken();
        mvc.perform(post("/api/posts").header("Authorization", bearer(t)).contentType(JSON).content("{bad"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
        mvc.perform(get("/api/nope")).andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void 삭제된_글은_soft_delete로_행은_남고_조회되지_않는다() throws Exception {
        String t = newUserToken();
        long id = createPost(t, "소프트" + uniq(), "본문");
        mvc.perform(delete("/api/posts/" + id).header("Authorization", bearer(t))).andExpect(status().isNoContent());
        Integer rows = jdbc.queryForObject("select count(*) from posts where id = ? and deleted_at is not null", Integer.class, id);
        org.junit.jupiter.api.Assertions.assertEquals(1, rows);
        getPosts("").andExpect(jsonPath("$.data[?(@.id == " + id + ")]").isEmpty());
    }
}
