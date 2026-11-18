# study2 — 핵심 구조: 컴포넌트·props·children

> 🎯 **목표**: React의 기본 단위인 **함수 컴포넌트**를 정의하고, props·children으로 부모→자식 데이터를 내려주는 구조를 직접 만든다.

- 이전: [study1.md](./study1.md) — Hello World와 기본 문법
- 다음: [study3.md](./study3.md) — 데이터(상태) 다루기
- 실습 코드: [`JSX_study/demo/src/components`](./JSX_study/demo/src/components)

---

## 📖 이론

### 2.1 컴포넌트 = 화면 조각을 돌려주는 함수

```jsx
function FruitBadge(props) { return <span>{props.children}</span> }
```

- 이름은 **대문자 시작** (`<FruitBadge />`). 소문자는 `<div>` 같은 HTML 태그로 해석됩니다.
- 파일 하나에 컴포넌트 하나, `export default`로 내보내는 것이 기본 규칙입니다.
- 한 번 만든 컴포넌트는 다른 곳에서 `import`해서 레고처럼 조립합니다.

### 2.2 props — 부모가 자식에게 주는 읽기 전용 값

- 속성처럼 전달: `<FruitCard fruit={fruit} />`
- 받는 쪽에서 **구조 분해**: `function FruitCard({ fruit }) { … }`
- **자식은 props를 수정하지 않습니다.** 바꾸고 싶으면 부모가 바꾼 값을 다시 내려줍니다(단방향 데이터 흐름).

### 2.3 children — 태그 사이의 내용

`<FruitBadge>품절</FruitBadge>`의 `품절`이 `props.children`입니다. 감싸는 틀(카드, 모달, 레이아웃)을 만들 때 씁니다.

### 2.4 컴포넌트를 나누는 기준

| 신호 | 분리 |
|---|---|
| 같은 JSX가 2번 이상 반복된다 | 컴포넌트로 추출 |
| 한 파일이 한 화면에 안 들어온다 | 의미 단위로 쪼갬 |
| "목록 / 항목 / 뱃지"처럼 역할이 다르다 | 역할별로 분리 |

---

## 🛠️ 실기

### 1. 컴포넌트 트리

```text
FruitListPractice (부모: 데이터 보유)
 └─ FruitCard × N  (props: fruit)
     └─ FruitBadge (props: soldout, children: 텍스트)
```

### 2. [`FruitBadge.jsx`](./JSX_study/demo/src/components/FruitBadge.jsx) — children

```jsx
function FruitBadge({ soldout, children }) {
  return (
    <span className={`badge${soldout ? ' soldout' : ''}`}>{children}</span>
  )
}
export default FruitBadge
```

| 줄 | 설명 |
|---|---|
| 1 | props 객체를 `{ soldout, children }`으로 구조 분해. `children`은 예약된 이름 |
| 3 | `soldout`이 true면 `badge soldout`, 아니면 `badge` |
| 3 | `{children}` 자리에 부모가 태그 사이에 넣은 내용이 그대로 들어감 |

### 3. [`FruitCard.jsx`](./JSX_study/demo/src/components/FruitCard.jsx) — props + 자식 조립

```jsx
import FruitBadge from './FruitBadge.jsx'

function FruitCard({ fruit }) {
  return (
    <li className="fruit-card">
      <span className={`name${fruit.inStock ? '' : ' soldout'}`}>{fruit.name}</span>
      <FruitBadge soldout={!fruit.inStock}>
        {fruit.inStock ? '재고 있음' : '품절'}
      </FruitBadge>
    </li>
  )
}
```

| 줄 | 설명 |
|---|---|
| 1 | 다른 파일의 컴포넌트를 `import` (JSX 프로젝트는 `.jsx`를 적어도 됨) |
| 3 | 부모가 넘긴 `fruit` 객체 **하나**만 받는다. 필요한 값이 많으면 객체로 묶으면 prop 수가 줄어듦 |
| 6 | 데이터에서 파생한 값(`fruit.inStock`)으로 클래스 결정 |
| 7 | boolean prop `soldout`은 `!fruit.inStock`으로 계산해서 전달 |
| 8 | `FruitBadge`의 `children`으로 들어가는 삼항 표현식 |

### 4. [`FruitListPractice.jsx`](./JSX_study/demo/src/components/FruitListPractice.jsx) — 부모

```jsx
{initialFruits.map((fruit) => (
  <FruitCard key={fruit.id} fruit={fruit} />
))}
```

- `key`는 React가 쓰는 값이라 자식 컴포넌트 안에서는 `props.key`로 읽을 수 없습니다.
- **데이터는 부모에 두고, 자식은 받은 값을 그리기만** 합니다. 이 원칙이 study3의 "상태 끌어올리기"로 이어집니다.

### 5. 직접 만들어 보기 (과제)

`ProductCard`를 새로 만들어 보세요. (정답 예시는 설명용 코드입니다.)

```jsx
// components/ProductCard.jsx
import FruitBadge from './FruitBadge.jsx'

function ProductCard({ product, children }) {
  return (
    <article className="fruit-card">
      <h3>{product.name}</h3>
      <p>{product.price.toLocaleString()}원</p>
      <FruitBadge soldout={product.stock === 0}>
        {product.stock === 0 ? '품절' : `재고 ${product.stock}개`}
      </FruitBadge>
      {children}
    </article>
  )
}
export default ProductCard
```

사용:

```jsx
<ProductCard product={{ name: '노트북', price: 1200000, stock: 3 }}>
  <button>장바구니</button>
</ProductCard>
```

확인할 것: ① 다른 데이터로 두 번 재사용되는가 ② 버튼(children)이 카드 안에 들어가는가 ③ `product`를 자식 안에서 수정하지 않았는가.

### 6. TS 미리보기 — props에 타입 붙이기 (study14에서 본격)

[`TSX_study/project/src/components/PostCard.tsx:5-9`](./TSX_study/project/src/components/PostCard.tsx)

```tsx
interface PostCardProps {
  post: Post
  isFavorite: boolean
  onToggleFavorite: (postId: number) => void
}
```

props의 모양을 `interface`로 선언하면, 빠뜨린 prop이나 잘못된 타입을 **빌드 단계에서** 잡아 줍니다.

---

## 🐞 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 컴포넌트가 아무것도 안 그려지고 `<fruitcard>`로 보임 | 소문자 이름 | 대문자 시작 `FruitCard` |
| `Cannot read properties of undefined (reading 'name')` | 부모가 prop을 안 넘김 / 이름 불일치 | 부모에서 `fruit={…}` 전달 확인 |
| prop을 `fruit.name = '...'`으로 바꾸려다 반영 안 됨 | props는 읽기 전용 | 부모의 상태를 바꾸고 새 props로 내려주기 |
| `Element type is invalid: … got: object` | `export default`와 `import { }` 방식 불일치 | default는 `import X from`, named는 `import { X } from` |
| 순환 import 경고 | A↔B가 서로 import | 공통 부분을 제3의 파일로 분리 |

---

## ☐ 체크리스트

- [ ] 컴포넌트 이름이 대문자로 시작해야 하는 이유를 설명할 수 있다
- [ ] props 구조 분해로 값을 받고, props를 수정하면 안 되는 이유를 안다
- [ ] `children`을 사용하는 컴포넌트를 직접 만들었다 (`ProductCard` 과제)
- [ ] 같은 컴포넌트를 서로 다른 데이터로 두 번 이상 재사용했다
- [ ] 부모(데이터) → 자식(표시) 구조를 트리로 그릴 수 있다
- [ ] `interface`로 props 타입을 붙이면 무엇이 좋은지 한 줄로 말할 수 있다

---

## ➡️ 다음 단계 연결

지금까지의 데이터는 **바뀌지 않는 상수**였습니다. [study3](./study3.md)에서 `useState`로 데이터가 바뀌면 화면이 따라 바뀌게 만듭니다.
