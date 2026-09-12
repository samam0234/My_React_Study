# study7 (고급 기술 구현 2) — axios/fetch API 연동, 커스텀 훅, 로딩/에러/빈 상태, 페이지네이션

지금까지는 전부 목업 데이터(고정 배열)였습니다. 이번엔 실제 네트워크 요청을 붙이고, 요청 로직을 재사용 가능한 형태(커스텀 훅)로 뽑아내며, "데이터가 없을 수도, 실패할 수도, 로딩 중일 수도 있다"는 걸 항상 화면에 명시하는 습관을 실습합니다.

```
- [x] Vite + React + JS 프로젝트 생성
- [x] 함수 컴포넌트, props, children
- [x] useState / useEffect / useRef
- [x] 리스트 렌더링과 key
- [x] React Router 중첩 라우팅
- [x] 폼 상태 다루기 + API 연동 (axios / fetch)         (이번 문서 — 체크리스트 완료!)
- [ ] Context 또는 Zustand로 전역 상태 (로그인)
- [ ] 백엔드와 CORS 연동
```

대응하는 실습 프로젝트: [`demo/`](./demo)

---

## 1. `axios` vs 브라우저 내장 `fetch`

Vue 학습(study6)에서는 브라우저 내장 `fetch`로 원리를 먼저 익혔습니다. React 쪽에서는 실무에서 더 흔히 쓰이는 **axios**를 실습합니다.

```bash
npm install axios
```

| | `fetch` | `axios` |
|---|---|---|
| 설치 | 불필요 (브라우저 내장) | 별도 패키지 |
| JSON 파싱 | `res.json()` 직접 호출 (비동기) | 자동으로 `res.data`에 파싱된 값이 들어있음 |
| HTTP 에러(404, 500) | 자동으로 예외 처리 안 됨 → `res.ok` 직접 확인 필요 | 2xx가 아니면 **자동으로 예외(reject)** 발생 |
| 공통 설정(baseURL, 헤더, 인터셉터) | 직접 함수로 감싸야 함 | `axios.create({...})`로 인스턴스화 지원 |

이런 이유로 여러 API를 호출하는 실무 프로젝트에서는 axios를 즐겨 씁니다 (물론 `fetch`만으로도 유틸 함수를 잘 만들면 충분히 가능합니다).

## 2. 기업형 구조 — `api/` 폴더

study0 7장에서 예고한 `api/` 폴더를 실제로 만들었습니다.

```
demo/src/api/
├─ client.js   # axios 인스턴스 (baseURL, timeout 등 공통 설정)
└─ posts.js    # 엔드포인트별 함수
```

```js
// api/client.js
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
})
```

```js
// api/posts.js
import { apiClient } from './client.js'

export async function fetchPosts({ page, limit }) {
  const res = await apiClient.get('/posts', {
    params: { _page: page, _limit: limit },
  })
  return res.data
}
```

- **인스턴스를 분리하는 이유**: 나중에 JWT 토큰을 헤더에 자동으로 붙이거나(요청 인터셉터), 401 응답 시 자동 로그아웃(응답 인터셉터) 같은 공통 로직을 `client.js` 한 곳에 모아둘 수 있습니다 (study10에서 백엔드 연동/CORS와 함께 더 다룸).
- **컴포넌트는 `apiClient`를 직접 모릅니다** — `fetchPosts()`라는, "무엇을 하는지"만 드러내는 함수를 호출합니다. 나중에 엔드포인트 경로가 바뀌거나 axios에서 다른 라이브러리로 바꿔도 컴포넌트 코드는 그대로입니다.

## 3. 커스텀 훅 — `useFetch`

### 3.1 왜 커스텀 훅인가

"로딩 상태 켜기 → 요청 → 성공 시 데이터 저장 / 실패 시 에러 저장 → 로딩 상태 끄기"라는 흐름은 API를 부르는 모든 화면에서 반복됩니다. 이 반복을 함수로 뽑아낸 것이 **커스텀 훅**입니다.

> 커스텀 훅은 특별한 문법이 아니라, **이름이 `use`로 시작하고 내부에서 다른 Hook(`useState`, `useEffect` 등)을 사용하는 평범한 함수**입니다. Vue의 "컴포저블(composable, `useXxx.js` 함수)"과 개념이 완전히 같습니다.

```js
// hooks/useFetch.js
export function useFetch(fetcher, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, deps)

  return { data, loading, error }
}
```

- **`ignore` 플래그(study3의 클린업 복습)**: 사용자가 페이지를 빠르게 넘기면(1페이지 요청 중에 2페이지로 이동) 오래된 요청의 응답이 나중에 도착해서 최신 상태를 덮어쓰는 문제(race condition)가 생길 수 있습니다. `deps`가 바뀌어 effect가 재실행되기 전에 클린업이 먼저 실행되며 `ignore = true`가 되므로, "이미 낡은 요청"의 결과는 무시됩니다.
- **반환값이 객체 하나(`{ data, loading, error }`)**: 이 세 가지를 쓰는 컴포넌트는 이 훅 하나만 호출하면 됩니다 — Vue의 컴포저블이 `{ data, loading, error }`를 반환하는 것과 정확히 같은 패턴입니다.

## 4. 로딩 / 에러 / 빈 상태 — 화면에 항상 명시하기

`PostListPage.jsx`에서 세 가지 상태를 순서대로 분기 처리했습니다 (study0 7장에서 예고한 원칙의 실제 구현).

```jsx
if (loading) return <p>불러오는 중...</p>

if (error) return (
  <>
    <p className="error-text">게시글을 불러오지 못했습니다: {error.message}</p>
    <button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</button>
  </>
)

if (!posts || posts.length === 0) return <p>게시글이 없습니다.</p>

return (/* 정상 목록 렌더링 */)
```

- **로딩**: 아무것도 안 보여주고 방치하면 사용자가 "멈췄나?" 오해하기 쉽습니다.
- **에러**: "무엇을 실패했는지" + "재시도 방법"을 같이 보여줍니다. `axios`가 던진 에러는 `error.message`에 사람이 읽을 수 있는 설명이 들어있습니다.
- **빈 상태**: 요청은 성공했지만 결과가 0개인 경우 — "에러"와는 다른 문구로 구분해야 사용자가 혼란스럽지 않습니다.
- 이 네 가지(로딩/에러/빈/정상) 분기 순서를 지키는 것이 습관이 되면, 실무에서 "로딩 스피너가 안 사라진다", "에러인데 빈 화면만 보인다" 같은 흔한 버그를 예방할 수 있습니다.

## 5. 페이지네이션 실습

```jsx
const [page, setPage] = useState(1)
const [reloadKey, setReloadKey] = useState(0)

const { data: posts, loading, error } = useFetch(
  () => fetchPosts({ page, limit: LIMIT }),
  [page, reloadKey],
)
```

```jsx
<button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← 이전</button>
<span>{page} 페이지</span>
<button disabled={posts.length < LIMIT} onClick={() => setPage((p) => p + 1)}>다음 →</button>
```

- `deps`에 `page`를 넣었기 때문에, 페이지 버튼을 누를 때마다 `useFetch` 내부의 `useEffect`가 재실행되어 새 페이지 데이터를 다시 요청합니다.
- JSONPlaceholder는 전체 게시글 개수를 응답에 알려주지 않으므로, "이번 페이지에서 받은 개수가 `LIMIT`보다 적으면 마지막 페이지"라고 간주해서 "다음" 버튼을 비활성화했습니다. 실제 백엔드를 붙일 때는 보통 응답에 `totalCount`나 `hasNext` 같은 필드가 있어서 더 정확하게 처리할 수 있습니다.
- **"다시 시도" 버튼이 `reloadKey`를 쓰는 이유**: `page` 값을 그대로 다시 `setPage(page)`로 넣으면, React는 "이전 상태와 같은 값"이라 판단해 리렌더링(및 effect 재실행)을 건너뜁니다. 그래서 매번 값이 바뀌는 `reloadKey`(증가하는 숫자)를 별도로 두고 `deps`에 같이 넣어서, 같은 페이지라도 강제로 다시 요청하게 만들었습니다.

## 6. 실행 확인

```bash
cd demo
npm run dev
```

- 네비게이션의 "게시글 목록 (API)" 클릭 → 잠깐 "불러오는 중..." 문구가 보인 뒤 실제 게시글 5개가 뜨는지
- "다음" 클릭 → 페이지 번호가 올라가고 다른 게시글 목록으로 바뀌는지, "이전"이 활성화되는지
- "이전"으로 1페이지까지 돌아가면 "이전" 버튼이 비활성화되는지
- (선택) 개발자 도구 네트워크 탭을 "오프라인"으로 바꾼 뒤 "다시 시도" 클릭 → 에러 문구가 뜨는지, 다시 온라인으로 바꾸고 "다시 시도" 클릭 → 정상 로딩되는지

`npm run build`까지 에러 없이 되는 것과, 실제로 JSONPlaceholder에 요청이 가서 200 응답을 받는 것까지 확인했습니다.

## 7. 다음 단계 (study8 예정 — 고급 기술 구현 3)

- study6에서 `localStorage` + 함수 3개로 흉내냈던 로그인 상태를, **Context API**로 정식 전환
- 여러 컴포넌트(헤더, 마이페이지, 로그인 폼)가 하나의 로그인 상태를 실시간으로 공유하는 구조 만들기
