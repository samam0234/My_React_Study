package com.example.board.repository;

import com.example.board.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    // q 는 서비스가 "%소문자%" 로 이스케이프해서 넘긴다 (바인딩 파라미터 — SQL 인젝션 방지).
    String SEARCH = "(lower(p.title) like :q escape '\\' or lower(p.body) like :q escape '\\')";

    @Override
    @EntityGraph(attributePaths = "author")
    Page<Post> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query(value = "select p from Post p where " + SEARCH, countQuery = "select count(p) from Post p where " + SEARCH)
    Page<Post> search(@Param("q") String q, Pageable pageable);

    // 정렬: -commentCount (댓글 많은 순, 같으면 최신 순)
    @EntityGraph(attributePaths = "author")
    @Query(
            value = "select p from Post p order by (select count(c) from Comment c where c.post = p) desc, p.id desc",
            countQuery = "select count(p) from Post p")
    Page<Post> findAllByCommentCount(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query(
            value = "select p from Post p where " + SEARCH + " order by (select count(c) from Comment c where c.post = p) desc, p.id desc",
            countQuery = "select count(p) from Post p where " + SEARCH)
    Page<Post> searchByCommentCount(@Param("q") String q, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    java.util.Optional<Post> findWithAuthorById(Long id);
}
