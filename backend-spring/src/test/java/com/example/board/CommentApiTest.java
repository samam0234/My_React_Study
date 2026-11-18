package com.example.board;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

class CommentApiTest extends ApiTestBase {

    private long addComment(String token, long postId, String body) throws Exception {
        String res = mvc.perform(post("/api/posts/" + postId + "/comments").header("Authorization", bearer(token)).contentType(JSON)
                        .content("{\"body\":\"" + body + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(res, "$.data.id")).longValue();
    }

    @Test
    void 댓글을_쓰면_201이고_목록과_commentCount에_반영된다() throws Exception {
        String t = newUserToken();
        long post = createPost(t, "댓글글" + uniq(), "본문");
        addComment(t, post, "첫 댓글");
        mvc.perform(get("/api/posts/" + post + "/comments")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].body").value("첫 댓글"))
                .andExpect(jsonPath("$.data[0].postId").value((int) post))
                .andExpect(jsonPath("$.data[0].author.nickname").isNotEmpty());
        mvc.perform(get("/api/posts/" + post)).andExpect(jsonPath("$.data.commentCount").value(1));
    }

    @Test
    void 비로그인은_댓글을_쓸_수_없다_401() throws Exception {
        String t = newUserToken();
        long post = createPost(t, "댓글글" + uniq(), "본문");
        mvc.perform(post("/api/posts/" + post + "/comments").contentType(JSON).content("{\"body\":\"x\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void 빈_댓글은_400_없는_글에는_404() throws Exception {
        String t = newUserToken();
        long post = createPost(t, "댓글글" + uniq(), "본문");
        mvc.perform(post("/api/posts/" + post + "/comments").header("Authorization", bearer(t)).contentType(JSON).content("{\"body\":\" \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.body").isArray());
        mvc.perform(post("/api/posts/987654321/comments").header("Authorization", bearer(t)).contentType(JSON).content("{\"body\":\"x\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/posts/987654321/comments")).andExpect(status().isNotFound());
    }

    @Test
    void 남의_댓글_삭제는_403_본인과_관리자는_204() throws Exception {
        String owner = newUserToken();
        String other = newUserToken();
        String admin = newAdminToken();
        long post = createPost(owner, "댓글글" + uniq(), "본문");
        long c1 = addComment(owner, post, "내 댓글");
        long c2 = addComment(owner, post, "또 내 댓글");
        mvc.perform(delete("/api/comments/" + c1).header("Authorization", bearer(other))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/comments/" + c1).header("Authorization", bearer(owner))).andExpect(status().isNoContent());
        mvc.perform(delete("/api/comments/" + c2).header("Authorization", bearer(admin))).andExpect(status().isNoContent());
        mvc.perform(delete("/api/comments/" + c2).header("Authorization", bearer(admin))).andExpect(status().isNotFound());
    }

    @Test
    void 글을_삭제하면_그_글의_댓글_목록도_404() throws Exception {
        String t = newUserToken();
        long post = createPost(t, "삭제글" + uniq(), "본문");
        addComment(t, post, "댓글");
        mvc.perform(delete("/api/posts/" + post).header("Authorization", bearer(t))).andExpect(status().isNoContent());
        mvc.perform(get("/api/posts/" + post + "/comments")).andExpect(status().isNotFound());
    }
}
