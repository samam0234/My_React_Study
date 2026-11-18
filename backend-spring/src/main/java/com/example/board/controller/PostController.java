package com.example.board.controller;

import com.example.board.dto.Dtos.CommentCreateRequest;
import com.example.board.dto.Dtos.CommentDto;
import com.example.board.dto.Dtos.DataResponse;
import com.example.board.dto.Dtos.PageResponse;
import com.example.board.dto.Dtos.PostCreateRequest;
import com.example.board.dto.Dtos.PostDetailDto;
import com.example.board.dto.Dtos.PostSummaryDto;
import com.example.board.dto.Dtos.PostUpdateRequest;
import com.example.board.security.AuthUser;
import com.example.board.service.CommentService;
import com.example.board.service.PostService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 컨트롤러에는 비즈니스 로직이 없다 — 요청을 받아 서비스에 넘기고 DTO 를 돌려줄 뿐이다. */
@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService posts;
    private final CommentService comments;

    public PostController(PostService posts, CommentService comments) {
        this.posts = posts;
        this.comments = comments;
    }

    @GetMapping("/posts")
    public PageResponse<PostSummaryDto> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort) {
        return posts.list(page, limit, q, sort);
    }

    @GetMapping("/posts/{id}")
    public DataResponse<PostDetailDto> get(@PathVariable Long id) {
        return new DataResponse<>(posts.get(id));
    }

    @PostMapping("/posts")
    public ResponseEntity<DataResponse<PostDetailDto>> create(
            @AuthenticationPrincipal AuthUser me, @Valid @RequestBody PostCreateRequest req) {
        PostDetailDto created = posts.create(me, req);
        return ResponseEntity.created(URI.create("/api/posts/" + created.id())).body(new DataResponse<>(created));
    }

    @PatchMapping("/posts/{id}")
    public DataResponse<PostDetailDto> update(
            @AuthenticationPrincipal AuthUser me, @PathVariable Long id, @Valid @RequestBody PostUpdateRequest req) {
        return new DataResponse<>(posts.update(me, id, req));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        posts.delete(me, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/posts/{id}/comments")
    public DataResponse<List<CommentDto>> comments(@PathVariable Long id) {
        return new DataResponse<>(comments.list(id));
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<DataResponse<CommentDto>> addComment(
            @AuthenticationPrincipal AuthUser me, @PathVariable Long id, @Valid @RequestBody CommentCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(comments.create(me, id, req)));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        comments.delete(me, id);
        return ResponseEntity.noContent().build();
    }
}
