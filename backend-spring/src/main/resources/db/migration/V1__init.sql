-- 노션 "PostgreSQL" 페이지의 게시판 스키마(PostgreSQL 16+)를 그대로 옮긴 것 + 댓글·AI 사용량 테이블.
-- 스키마는 Flyway 마이그레이션으로만 바꾼다 (JPA ddl-auto 는 validate).
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  nickname      VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  body       TEXT NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',      -- 배열 타입
  meta       JSONB  NOT NULL DEFAULT '{}',      -- 자유 필드
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ                         -- soft delete
);
CREATE INDEX idx_posts_user_id ON posts (user_id);   -- PostgreSQL 은 FK 인덱스를 자동으로 만들지 않는다
CREATE INDEX idx_posts_created_at_alive ON posts (created_at) WHERE deleted_at IS NULL;   -- 부분 인덱스

CREATE TABLE comments (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);

-- 노션 "AI 모델 연동 · MCP" §5: 대화 기록·토큰 사용량 (사용자별 일일 한도 계산용)
CREATE TABLE ai_conversations (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations (user_id);

CREATE TABLE ai_messages (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  input_tokens    INT,
  output_tokens   INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages (conversation_id);
