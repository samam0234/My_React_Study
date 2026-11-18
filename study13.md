# study13 — 생태계 라이브러리 (UI · 유틸)

> 🎯 **목표**: 게시판 화면에 MUI와 Tailwind + shadcn/ui를 각각 적용해 보고, 테마·반응형·접근성·다크 모드를 다루며, 언제 어떤 방식을 고를지 기준을 기록한다.

- 이전: [study12.md](./study12.md) — 성능 최적화
- 다음: [study14.md](./study14.md) — TypeScript·정적 분석
- 대상 화면: [`PostListPage.tsx`](./TSX_study/project/src/pages/PostListPage.tsx), [`LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx), [`PostCard.tsx`](./TSX_study/project/src/components/PostCard.tsx)

> ✅ **실제 코드와 검증**: **Tailwind CSS v4(반응형 `sm:`/`md:`, 다크 모드 토글, 접근성)** 는 [`TSX_study/final`](./TSX_study/final)에 구현하고 단위·E2E로 확인했습니다. **MUI와 shadcn/ui는 이 문서의 예제로만 있고 구현하지 않았습니다**(해당 체크박스는 비워 둠). 색 대비·Lighthouse 접근성 점검도 하지 않았습니다.

---

## 📖 이론

### 13.1 기업 화면은 스타일을 처음부터 짜지 않는다

디자인 시스템이나 UI 라이브러리 위에서 만드는 경우가 많습니다(노션 정리). 현재 저장소는 [`App.css`](./TSX_study/project/src/App.css) 직접 CSS입니다. 이를 라이브러리로 바꾸며 차이를 체감합니다.

### 13.2 두 가지 방식

| | MUI (Material UI) | Tailwind CSS + shadcn/ui |
|---|---|---|
| 방식 | **완성된 컴포넌트를 import**해서 사용 | 유틸리티 클래스로 직접 스타일, shadcn은 **컴포넌트 코드를 내 프로젝트로 복사**해 수정 |
| 커스터마이징 | `createTheme`, `sx`, 컴포넌트 `props` | 복사된 소스를 직접 편집 |
| 번들 | 라이브러리 의존 | 복사한 코드 + 사용한 클래스만 CSS에 생성 |
| 강점 | 빠르게 완성도 높은 UI | 디자인 자유도, 소유권 |
| 약점 | 디자인이 비슷해지고 덮어쓰기 어려움 | 클래스가 길어지고 초기 설정 필요 |
| (선택) Ant Design | 관리자 화면용 풍부한 컴포넌트(표·폼) 레퍼런스 | |

**선택 기준 기록**: "빨리 만들어야 하고 관리자/내부 도구" → MUI·Ant Design, "브랜드 디자인이 있고 세밀한 제어" → Tailwind + shadcn/ui, "작은 학습 프로젝트" → 직접 CSS도 충분.

### 13.3 접근성(a11y) 기본

- 모든 입력에 `<label>` (`htmlFor`/감싸기) — 현재 [`LoginPage.tsx:56-59`](./TSX_study/project/src/pages/LoginPage.tsx)는 `<label>` 안에 `<input>`을 넣는 방식이라 연결됨
- 키보드만으로 모든 기능 사용 가능 (Tab, Enter, Esc)
- 색 대비(텍스트/배경 4.5:1 이상 권장)
- 아이콘 버튼에는 `aria-label`
- 모달은 포커스를 가두고 Esc로 닫힘 → 라이브러리(MUI Dialog, shadcn Dialog/Radix)가 처리

### 13.4 유틸리티 라이브러리 (UI 외에 자주 쓰는 것)

| 용도 | 라이브러리 | 메모 |
|---|---|---|
| 클래스 조합 | `clsx`, `tailwind-merge` | study1의 템플릿 리터럴 대체 |
| 날짜 | `dayjs`, `date-fns` | 스펙의 ISO 8601 UTC → 지역 시간 변환 |
| 폼 | `react-hook-form` | study5 수동 폼의 라이브러리 버전 |
| 스키마 검증 | `zod` | 폼·API 응답 검증 (study14) |
| 아이콘 | `lucide-react`, `@mui/icons-material` | |

---

## 🛠️ 실기

### 1. MUI — 목록·폼·모달 교체 (노션 체크 항목)

```bash
npm i @mui/material @emotion/react @emotion/styled
```

**테마 한 곳에서 관리 (색상·폰트)**

```tsx
// theme.ts
import { createTheme } from '@mui/material/styles'
export const theme = createTheme({
  palette: { primary: { main: '#2563eb' }, mode: 'light' },
  typography: { fontFamily: '"Pretendard", system-ui, sans-serif' },
  shape: { borderRadius: 10 },
})

// main.tsx
import { ThemeProvider, CssBaseline } from '@mui/material'
<ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider>
```

**목록 교체** ([`PostCard.tsx`](./TSX_study/project/src/components/PostCard.tsx) → MUI)

```tsx
import { Card, CardActionArea, CardContent, IconButton, Typography } from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

<Card variant="outlined">
  <CardActionArea component={Link} to={`/posts/${post.id}`}>
    <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography>{post.title}</Typography>
      <IconButton aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'} onClick={handleFavoriteClick}>
        {isFavorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
      </IconButton>
    </CardContent>
  </CardActionArea>
</Card>
```

**폼 교체** ([`LoginPage.tsx`](./TSX_study/project/src/pages/LoginPage.tsx))

```tsx
<TextField label="이메일" name="email" type="email" value={form.email} onChange={handleChange}
           error={submitted && !emailValid} helperText={submitted && !emailValid ? '올바른 이메일 형식이 아닙니다.' : ' '} />
```

검증 로직(`emailValid`)은 그대로 두고 **표시만 바꿉니다.** study5에서 검증을 파생 값으로 분리해 둔 덕분입니다.

**모달 — 삭제 확인**

```tsx
<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>정말 삭제할까요?</DialogTitle>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>취소</Button>
    <Button color="error" onClick={onConfirm}>삭제</Button>
  </DialogActions>
</Dialog>
```

**다크 모드**: `createTheme({ palette: { mode: prefersDark ? 'dark' : 'light' } })` — `useMediaQuery('(prefers-color-scheme: dark)')` 결과로 모드를 선택.

### 2. Tailwind CSS — 반응형 레이아웃

```bash
npm i tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

```css
/* src/index.css 맨 위 */
@import "tailwindcss";
```

(Tailwind v4 방식입니다. v3 이하는 `tailwind.config.js`와 `@tailwind` 지시어를 씁니다 — 버전에 맞는 문서를 따르세요.)

**모바일 우선 반응형** — 접두어 없는 클래스가 모바일, `sm:` `md:`는 그 이상 너비에 적용

```tsx
<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {posts.map((p) => (
    <li key={p.id} className="rounded-xl border border-gray-200 p-4 hover:shadow-md dark:border-gray-700">
      <Link to={`/posts/${p.id}`} className="font-medium text-blue-600 dark:text-blue-400">{p.title}</Link>
    </li>
  ))}
</ul>
```

| 클래스 | 의미 |
|---|---|
| `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | 모바일 1열 → 640px↑ 2열 → 1024px↑ 3열 |
| `p-4`, `gap-3` | 간격 스케일 (4 = 1rem) |
| `dark:…` | 다크 모드일 때만 적용 |
| `hover:shadow-md` | 상태 변형자 |

**다크 모드**: 기본은 OS 설정(`prefers-color-scheme`)을 따릅니다. 버튼으로 토글하려면 v4에서 `@custom-variant dark (&:where(.dark, .dark *));`를 선언하고 `<html>`에 `dark` 클래스를 붙입니다.

### 3. shadcn/ui — 폼·대화상자·테이블 가져와 수정

shadcn/ui는 `@/` 경로 별칭과 Tailwind를 전제로 합니다 (study8 §5).

```bash
npx shadcn@latest init          # components.json 생성, 유틸(cn) 설정
npx shadcn@latest add button input label dialog table
```

→ `src/components/ui/button.tsx` 등 **소스 코드가 내 프로젝트에 복사**됩니다. 그래서 라이브러리 업데이트를 기다리지 않고 직접 편집할 수 있습니다.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="grid gap-2">
  <Label htmlFor="email">이메일</Label>
  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} aria-invalid={submitted && !emailValid} />
  {submitted && !emailValid && <p className="text-sm text-red-600">올바른 이메일 형식이 아닙니다.</p>}
</div>
<Button type="submit">로그인</Button>
```

**수정 연습**: `components/ui/button.tsx`의 `variants`에 `danger` 변형을 추가해 삭제 버튼에 쓰기 → "복사해서 소유한다"는 의미를 체감.

### 4. 비교 기록표 (직접 채우기)

| 항목 | 직접 CSS (현재) | MUI | Tailwind + shadcn/ui |
|---|---|---|---|
| 목록·폼 교체에 걸린 시간 | — | ____ | ____ |
| 번들 크기 변화 (study12 방법) | 기준 | ____ kB | ____ kB |
| 디자인 수정이 쉬웠던 정도(1~5) | | | |
| 막혔던 점 | | | |
| 어느 상황에 고를지 | | | |

### 5. 접근성 점검 (키보드·라벨·색 대비)

1. 마우스를 치우고 **Tab 키만으로** 로그인까지 가능한가 (포커스 표시가 보이는가)
2. 모든 `input`에 라벨이 있는가 / 아이콘 버튼에 `aria-label`이 있는가
3. 모달이 열리면 포커스가 안으로 이동하고 `Esc`로 닫히는가
4. 브라우저 DevTools → Lighthouse → Accessibility 점검
5. 오류 메시지가 **색만으로** 구분되지 않는가 (문구 포함)

### 6. 유틸 한 가지 적용 — `clsx`

[`PostCard.tsx:23`](./TSX_study/project/src/components/PostCard.tsx)의 `className={isFavorite ? 'active' : ''}` 같은 조건 클래스가 많아지면:

```tsx
import clsx from 'clsx'
<button className={clsx('fav', isFavorite && 'active', disabled && 'opacity-50')}>
```

---

## ✅ 실제 구현 결과 (Tailwind v4, `TSX_study/final`)

| 항목 | 구현 | 검증 |
|---|---|---|
| 설정 | `tailwindcss` + `@tailwindcss/vite`, [`index.css`](./TSX_study/final/src/index.css)의 `@import 'tailwindcss'` | `npm run build` 성공 (CSS 17.19 kB, gzip 4.12) |
| 공통 UI 조각 | [`App.css`](./TSX_study/final/src/App.css)의 `.btn` `.input` `.card` — `@apply` (**파일 맨 위 `@reference "tailwindcss"` 필요**) | — |
| 반응형 | 모바일 기본 + `sm:`(헤더 가로 배치·여백), `md:grid-cols-2`(목록 2열), 검색창 `w-full sm:max-w-xs` | E2E: 1024px에서 목록 **2열**, 375px에서 **1열**·**가로 스크롤 없음** |
| **다크 모드 토글** | [`ThemeToggle.tsx`](./TSX_study/final/src/components/ThemeToggle.tsx) + [`themeStore.ts`](./TSX_study/final/src/store/themeStore.ts): 시스템 → 라이트 → 다크 순환, `<html>`의 `.dark` 클래스, `persist`(`board-theme`), 시스템일 때는 `prefers-color-scheme` 변경을 따라감. Tailwind v4는 `@custom-variant dark (&:where(.dark, .dark *))` 선언 | components.test(순환·클래스·저장), E2E: OS 설정에 따른 배경색 변화, **토글 후 새로고침해도 유지** |
| 접근성 | `<label htmlFor>` 연결([`FormField`](./TSX_study/final/src/components/FormField.tsx)), 오류 `aria-invalid` + `aria-describedby`, 상태 문구 `role=alert/status`, 토스트 `aria-live`, 건너뛰기 링크, `aria-pressed`, 아이콘 버튼 `aria-label`, `:focus-visible` | components.test, E2E "**키보드만으로 로그인**" |
| 유틸 | `clsx`로 조건부 클래스 | — |

노션 React 6개월차 3주차 체크리스트: 필드별 에러 메시지가 서버 `fields`와 맞물림 ✅(서버 `VALIDATION_ERROR.fields` → 입력란 아래), 키보드만으로 폼 제출 ✅, 전역 상태에는 꼭 필요한 값만 ✅(user·token·즐겨찾기·테마).

### 아직 하지 않은 것

- MUI 적용 (목록·폼·모달 교체), `createTheme` 테마 한 곳 관리, MUI 다크 모드
- shadcn/ui (`npx shadcn@latest init`, 폼·대화상자·테이블)
- 폼 라이브러리(`react-hook-form`) — 검증은 zod 스키마 + 직접 만든 상태로 처리
- **색 대비 검사**, Lighthouse 접근성 점수, 스크린 리더 직접 확인
- 번들 크기 비교(직접 CSS vs MUI vs Tailwind+shadcn) — 비교 기록표는 비어 있음

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| MUI 스타일이 기본 CSS와 충돌 | 전역 CSS(`index.css`)와 중복 | `CssBaseline` 사용, 기존 전역 스타일 정리 |
| `Link`와 MUI 컴포넌트를 함께 쓰면 타입 오류 | `component={Link}` + `to` prop 타입 | 제네릭 컴포넌트 prop 타입 확인, 필요 시 `RouterLink` 래핑 |
| Tailwind 클래스가 적용 안 됨 | 플러그인/`@import "tailwindcss"` 누락, 동적 클래스명(`text-${color}-500`) | 설정 확인, **완성된 클래스명 전체**를 코드에 적기 |
| `Cannot find module '@/components/...'` | alias를 Vite·tsconfig 한쪽만 설정 | 양쪽 설정 (study8) |
| shadcn init이 실패 | Tailwind 미설정 / 별칭 없음 | 선행 설정 후 재실행 |
| 다크 모드에서 글자가 안 보임 | 색을 고정값으로 지정 | `dark:` 변형·테마 토큰 사용 |
| 번들이 크게 늘어남 | 아이콘 패키지 전체 import | 필요한 아이콘만 개별 import |
| 모달에서 스크롤/포커스 이상 | 직접 만든 모달에 포커스 트랩 없음 | 라이브러리 Dialog 사용 |

---

## ☐ 체크리스트

- [ ] 라이브러리 방식(MUI)과 코드 복사 방식(shadcn/ui)의 차이를 설명할 수 있다
- [ ] **(노션) 기존 React 게시판에 MUI를 붙여 목록·폼·모달 교체**
- [ ] **(노션) 테마(색상·폰트) 한 곳에서 바꾸기**
- [x] **(노션) Tailwind의 반응형(`sm:`, `md:`) 유틸리티로 모바일 레이아웃**
- [ ] **(노션) shadcn/ui로 폼, 대화상자, 테이블 컴포넌트 가져와 수정**
- [ ] **(노션) 접근성 기본: 키보드 조작, label, 색 대비** — **부분 완료**: 키보드 조작·label·aria는 구현·검증, **색 대비는 미검사**
- [x] **(노션) 다크 모드** — Tailwind `dark:` + 토글 + 시스템 설정 연동, persist (MUI 테마 방식은 아님)
- [ ] 비교 기록표(직접 CSS / MUI / Tailwind+shadcn)를 채우고 "어느 시점에 어느 쪽을 고를지" 한 줄로 적었다
- [ ] 번들 크기 변화를 study12 방법으로 측정했다
- [ ] (선택) Ant Design 표/폼 컴포넌트를 둘러봤다

---

## ➡️ 다음 단계 연결

라이브러리가 늘수록 타입과 규칙이 중요해집니다. [study14](./study14.md)에서 **TypeScript 설정, 린트, 포매터**를 정리해 코드 품질을 자동으로 지킵니다.
