# React 학습 기록

Vue.js 학습을 마친 뒤 React로 넘어오며 정리한 학습 저장소입니다. 이론 문서 다음에는 **JSX 실습을 먼저** 하고, 그 다음 **TSX(TypeScript)** 로 이어집니다.

## 학습 문서

| 문서 | 내용 |
|---|---|
| [study0.md](./study0.md) | React 기초 이론 (JSX, Virtual DOM, Hook 등을 Vue와 비교) |
| [study1.md](./study1.md) | 프로젝트 생성 명령어, 함수 컴포넌트 / props / children 실습 |
| [study2.md](./study2.md) | useState, 이벤트 핸들링, 리스트 렌더링과 key |
| [study3.md](./study3.md) | useEffect, useRef |
| [study4.md](./study4.md) | 콜백 props(자식→부모 통신), Controlled Component 폼 검증 |
| [study5.md](./study5.md) | React Router 기본 라우팅 (목록 → 상세) |
| [study6.md](./study6.md) | 고급 1: 중첩 라우팅, 보호된 라우트 |
| [study7.md](./study7.md) | 고급 2: axios API 연동, 커스텀 훅, 페이지네이션 |
| [study8.md](./study8.md) | 고급 3: Context API 전역 로그인 상태 |
| [study9.md](./study9.md) | 고급 4: Zustand (Context와 비교) |
| [study10.md](./study10.md) | 고급 5: TypeScript 전환, 기업형 폴더 구조, CORS |
| [studyFinal.md](./studyFinal.md) | 종합: 미니 게시판 웹사이트 |

## 학습 순서

1. [study0.md](./study0.md) — 이론
2. [study1.md](./study1.md) ~ [study9.md](./study9.md) — JSX 기초 실습 ([`JSX_study/demo`](./JSX_study/demo))
3. JSX 응용 실습 — 가벼운 미니 게시판 ([`JSX_study/project`](./JSX_study/project))
4. [study10.md](./study10.md) — 기초 실습을 TypeScript로 전환한 결과 ([`TSX_study/demo`](./TSX_study/demo))
5. [studyFinal.md](./studyFinal.md) — TSX 응용 실습 ([`TSX_study/project`](./TSX_study/project))

## 프로젝트

`demo`는 기초 실습, `project`는 응용 실습입니다. JSX 응용은 TSX 응용보다 짧습니다.

- [`JSX_study/demo`](./JSX_study/demo): study1~9. JavaScript + JSX 기초 실습
- [`JSX_study/project`](./JSX_study/project): JSX 응용. 목록, 상세, 검색, 로그인만 있는 미니 게시판
- [`TSX_study/demo`](./TSX_study/demo): study10. 기초 실습을 TypeScript로 전환한 결과 (JSX 원본은 수정하지 않음)
- [`TSX_study/project`](./TSX_study/project): studyFinal. TSX 응용 (페이지네이션, 즐겨찾기, 댓글, 보호된 마이페이지)

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
cd JSX_study/demo       # JSX 기초 (study1~9)
# cd JSX_study/project  # JSX 응용
# cd TSX_study/demo     # TSX 기초 (study10)
# cd TSX_study/project  # TSX 응용 (studyFinal)
npm install
npm run dev             # 개발 서버 (기본 http://localhost:5173)
npm run build
```

## 기술 스택

React 19, Vite, TypeScript, react-router-dom, axios, Zustand

## 에이전트 / 커밋 규칙

- 공통 규칙: [.agent/AGENTS.md](./.agent/AGENTS.md)
- 커밋 가이드: [.agent/COMMIT_GUIDE.md](./.agent/COMMIT_GUIDE.md)
