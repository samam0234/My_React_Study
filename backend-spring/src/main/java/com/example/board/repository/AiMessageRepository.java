package com.example.board.repository;

import com.example.board.domain.AiMessage;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    /** 노션 §5 의 "오늘 사용량" 쿼리: 사용자별로 since 이후 입력+출력 토큰 합계 */
    @Query(
            value =
                    "select coalesce(sum(coalesce(m.input_tokens, 0) + coalesce(m.output_tokens, 0)), 0) "
                            + "from ai_messages m join ai_conversations c on c.id = m.conversation_id "
                            + "where c.user_id = :userId and m.created_at >= :since",
            nativeQuery = true)
    long sumTokensSince(@Param("userId") Long userId, @Param("since") Instant since);
}
