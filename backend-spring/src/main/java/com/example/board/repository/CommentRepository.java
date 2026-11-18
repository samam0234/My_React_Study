package com.example.board.repository;

import com.example.board.domain.Comment;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = "author")
    List<Comment> findByPostIdOrderByIdAsc(Long postId);

    @EntityGraph(attributePaths = {"author", "post"})
    java.util.Optional<Comment> findWithAuthorById(Long id);

    long countByPostId(Long postId);

    /** 목록에서 글마다 쿼리를 날리지 않도록(N+1) 한 번에 센다. 결과: [postId, count] */
    @Query("select c.post.id, count(c) from Comment c where c.post.id in :ids group by c.post.id")
    List<Object[]> countByPostIds(@Param("ids") Collection<Long> ids);
}
