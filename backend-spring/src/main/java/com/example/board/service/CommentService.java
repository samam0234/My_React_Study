package com.example.board.service;

import com.example.board.domain.Comment;
import com.example.board.domain.Post;
import com.example.board.domain.User;
import com.example.board.dto.Dtos.CommentCreateRequest;
import com.example.board.dto.Dtos.CommentDto;
import com.example.board.exception.ApiException;
import com.example.board.repository.CommentRepository;
import com.example.board.repository.PostRepository;
import com.example.board.repository.UserRepository;
import com.example.board.security.AuthUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository comments;
    private final PostRepository posts;
    private final UserRepository users;

    public CommentService(CommentRepository comments, PostRepository posts, UserRepository users) {
        this.comments = comments;
        this.posts = posts;
        this.users = users;
    }

    static CommentDto dto(Comment c, Long postId) {
        return new CommentDto(c.getId(), postId, c.getBody(), PostService.author(c.getAuthor()), c.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<CommentDto> list(Long postId) {
        requirePost(postId);
        return comments.findByPostIdOrderByIdAsc(postId).stream().map(c -> dto(c, postId)).toList();
    }

    @Transactional
    public CommentDto create(AuthUser me, Long postId, CommentCreateRequest req) {
        Post post = requirePost(postId);
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.unauthorized("토큰이 없거나 만료되었습니다."));
        return dto(comments.save(new Comment(post, user, req.body().trim())), postId);
    }

    @Transactional
    public void delete(AuthUser me, Long commentId) {
        Comment c = comments.findWithAuthorById(commentId).orElseThrow(() -> ApiException.notFound("댓글을 찾을 수 없습니다."));
        if (!c.getAuthor().getId().equals(me.id()) && !me.isAdmin()) throw ApiException.forbidden("작성자만 삭제할 수 있습니다.");
        comments.delete(c);
    }

    private Post requirePost(Long postId) {
        return posts.findById(postId).orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없습니다."));
    }
}
