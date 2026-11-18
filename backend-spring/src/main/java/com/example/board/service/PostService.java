package com.example.board.service;

import com.example.board.domain.Post;
import com.example.board.domain.User;
import com.example.board.dto.Dtos.AuthorDto;
import com.example.board.dto.Dtos.Meta;
import com.example.board.dto.Dtos.PageResponse;
import com.example.board.dto.Dtos.PostCreateRequest;
import com.example.board.dto.Dtos.PostDetailDto;
import com.example.board.dto.Dtos.PostSummaryDto;
import com.example.board.dto.Dtos.PostUpdateRequest;
import com.example.board.exception.ApiException;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import com.example.board.security.AuthUser;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    private static final Set<String> SORTS = Set.of("createdAt", "-createdAt", "-commentCount");

    private final PostRepository posts;
    private final CommentRepository comments;
    private final UserRepository users;

    public PostService(PostRepository posts, CommentRepository comments, UserRepository users) {
        this.posts = posts;
        this.comments = comments;
        this.users = users;
    }

    static AuthorDto author(User u) {
        return new AuthorDto(u.getId(), u.getNickname());
    }

    /** LIKE 의 와일드카드(% _ \)를 이스케이프하고 소문자로 바꿔 "%q%" 로 만든다. */
    static String likePattern(String q) {
        return "%" + q.toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryDto> list(Integer page, Integer limit, String q, String sort) {
        // 스펙 v1 §4: page 1 이상(기본 1), limit 1~50(기본 10, 50 초과는 50), sort 는 3가지만
        int p = Math.max(1, page == null ? 1 : page);
        int l = Math.min(50, Math.max(1, limit == null ? 10 : limit));
        String s = sort == null || sort.isBlank() ? "-createdAt" : sort;
        if (!SORTS.contains(s)) throw ApiException.badRequest("sort 값이 올바르지 않습니다.");
        String query = q == null ? "" : q.trim();

        Page<Post> result;
        if (s.equals("-commentCount")) {
            Pageable pageable = PageRequest.of(p - 1, l);
            result = query.isEmpty() ? posts.findAllByCommentCount(pageable) : posts.searchByCommentCount(likePattern(query), pageable);
        } else {
            Sort order = s.equals("createdAt")
                    ? Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"))
                    : Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
            Pageable pageable = PageRequest.of(p - 1, l, order);
            result = query.isEmpty() ? posts.findAll(pageable) : posts.search(likePattern(query), pageable);
        }

        List<Long> ids = result.getContent().stream().map(Post::getId).toList();
        Map<Long, Long> counts = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : comments.countByPostIds(ids)) counts.put((Long) row[0], (Long) row[1]);
        }
        List<PostSummaryDto> data = result.getContent().stream()
                .map(post -> new PostSummaryDto(post.getId(), post.getTitle(), author(post.getAuthor()), counts.getOrDefault(post.getId(), 0L), post.getCreatedAt()))
                .collect(Collectors.toList());
        int totalPages = Math.max(1, (int) Math.ceil(result.getTotalElements() / (double) l));
        return new PageResponse<>(data, new Meta(p, l, result.getTotalElements(), totalPages, query.isEmpty() ? null : query));
    }

    @Transactional(readOnly = true)
    public PostDetailDto get(Long id) {
        return detail(find(id));
    }

    @Transactional
    public PostDetailDto create(AuthUser me, PostCreateRequest req) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.unauthorized("토큰이 없거나 만료되었습니다."));
        return detail(posts.save(new Post(user, req.title().trim(), req.body().trim(), req.tags())));
    }

    @Transactional
    public PostDetailDto update(AuthUser me, Long id, PostUpdateRequest req) {
        Post post = find(id);
        // 인가(작성자 확인)는 DB 를 읽는 서비스 계층에서 — 컨트롤러·필터는 401 까지만 (노션 "인증 · 인가")
        if (!post.getAuthor().getId().equals(me.id())) throw ApiException.forbidden("작성자만 수정할 수 있습니다.");
        post.update(trim(req.title()), trim(req.body()), req.tags());
        return detail(post);
    }

    @Transactional
    public void delete(AuthUser me, Long id) {
        Post post = find(id);
        // 작성자 또는 관리자(role=admin)만 삭제할 수 있다
        if (!post.getAuthor().getId().equals(me.id()) && !me.isAdmin()) throw ApiException.forbidden("작성자만 삭제할 수 있습니다.");
        post.softDelete();
    }

    Post find(Long id) {
        return posts.findWithAuthorById(id).orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없습니다."));
    }

    private PostDetailDto detail(Post p) {
        return new PostDetailDto(p.getId(), p.getTitle(), p.getBody(), p.getTags(), author(p.getAuthor()), comments.countByPostId(p.getId()), p.getCreatedAt(), p.getUpdatedAt());
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}
