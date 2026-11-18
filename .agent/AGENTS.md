# 에이전트 공통 가이드라인 (인수인계 문서)

이 문서는 이 저장소에서 작업하는 모든 AI 에이전트(Claude, Grok, Codex 등)가 **공통으로** 지켜야 할 규칙을 정리한 인수인계 문서입니다.
`.claude/`, `.grok/`, `.codex/` 폴더의 에이전트별 문서는 이 문서를 기본으로 삼고, 도구별 특이사항만 추가로 기술합니다.

## 1. 저장소 개요

- React(Vite) 학습 기록 저장소입니다. 순서는 기초(study0~10) → 중간 응용(studyMidpoint) → 심화(study11~18) → 심화 응용(studyFinal)입니다.
- 루트의 학습 문서는 **모두 파일명 맨 앞이 `study`** 입니다: `study0.md` ~ `study18.md`, `studyMidpoint.md`, `studyFinal.md`. (숫자가 클수록 최신 진도, `studyMidpoint`는 study10 다음, `studyFinal`은 study18 다음)
- 각 문서 공통 구성: 목표 한 줄 → 📖 이론 → 🛠️ 실기(코드·줄별 설명) → 🐞 오류 노트 → ☐ 체크리스트 → ➡️ 다음 단계 연결
- `README.md`가 없으면 만듭니다(학습 문서 표 + 학습 순서 + 프로젝트 + 실행 방법).
- `demo`는 기초 실습, `project`는 응용 실습입니다.
- `JSX_study/demo/`: JavaScript + JSX(`.jsx`)로 개념을 하나씩 쌓는 기초 실습 (study1~9 내용의 코드 근거).
- `JSX_study/project/`: JSX 응용. 목록, 상세, 검색, 로그인만 있는 가벼운 미니 게시판입니다.
- `TSX_study/demo/`: 위 JSX 기초 실습을 TypeScript(`.tsx`)로 전환한 결과입니다. JSX 원본은 덮어쓰지 않습니다.
- `TSX_study/project/`: `studyMidpoint.md`에 대응하는 TSX 응용 미니 게시판입니다.
- `TSX_study/final/`: `studyFinal.md`의 프런트 결과물. `TSX_study/project`를 복사해 만든 심화 응용(원본은 수정하지 않음). 백엔드는 **Spring Boot + PostgreSQL**인 `backend-spring/`(공통 API 스펙 v1, AI 엔드포인트 포함)이고, 함께 `board-mcp/`(HTTP MCP 서버), 루트 `docker-compose.yml`, `.github/`, `.mcp.json`이 있습니다. 백엔드를 Node 등 다른 스택으로 바꾸지 않습니다(노션이 Spring Boot를 지정). study11~18 문서의 `✅ 실제 …` 절이 이 코드의 근거입니다.
- 문서에 "완료"라고 적는 것은 **직접 실행해서 확인한 것만**입니다. 실행하지 못한 것(외부 배포, GitHub Actions, 실제 Claude API 호출, tool use·Ollama, MUI·shadcn 등)은 "미완료/미측정"으로 남깁니다.
- 학습 문서에서 노션 체크 항목을 다룰 때는 해당 번호의 체크리스트에 `(노션)` 표시와 함께 넣습니다.

## 2. 작업 전 확인 사항

- 새 작업을 시작하기 전에 `studyN.md` 파일들을 번호 순서대로 확인하여 지금까지의 학습 진도와 맥락을 파악합니다.
- 실습 코드가 study 문서 설명과 어긋나지 않는지 확인합니다. 기초 개념은 `JSX_study/demo`, JSX 응용은 `JSX_study/project`, TS 전환은 `TSX_study/demo`, 중간 응용(studyMidpoint)은 `TSX_study/project`입니다.
- 새 studyN.md 문서를 추가/수정할 때는 이전 study 문서와 이어지는 흐름을 유지합니다.

## 3. 커밋 규칙

- 커밋 관련 규칙은 [COMMIT_GUIDE.md](./COMMIT_GUIDE.md) 문서를 따릅니다.

## 4. 언어 규칙

- 문서 내용, 커밋 설명: 한글
- 커밋 타입(prefix), 코드, 식별자, 파일명: 영어

## 5. 에이전트별 문서

- Claude: [.claude/CLAUDE.md](../.claude/CLAUDE.md)
- Grok: [.grok/GROK.md](../.grok/GROK.md)
- Codex: [.codex/AGENTS.md](../.codex/AGENTS.md)

## 6. 인수인계 원칙

- 작업을 마칠 때는 다음 에이전트/세션이 이어받을 수 있도록 변경 내용과 다음 단계 후보를 간단히 남깁니다.
- 불확실한 결정은 추측하지 말고 study 문서 내용을 근거로 삼습니다.
- 이 문서나 커밋 가이드에 없는 새로운 컨벤션이 필요해지면, 추측해서 각자 다르게 처리하지 말고 이 문서를 먼저 갱신합니다.
