import { useState } from 'react'

const fruitPool = ['사과', '바나나', '포도', '수박', '딸기', '망고']
let nextId = 4

const initialFruits = [
  { id: 1, name: '사과', inStock: true },
  { id: 2, name: '바나나', inStock: false },
  { id: 3, name: '포도', inStock: true },
]

// study2: study1의 정적 목록을 useState로 "진짜 상태"로 바꾼 버전.
function FruitInventoryPractice() {
  const [fruits, setFruits] = useState(initialFruits)
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)

  function addRandomFruit() {
    const name = fruitPool[Math.floor(Math.random() * fruitPool.length)]
    // 배열 상태는 직접 push 하지 않고, "새 배열"을 만들어 setState에 넘긴다 (불변성)
    setFruits((prev) => [...prev, { id: nextId++, name, inStock: true }])
  }

  function toggleStock(id) {
    setFruits((prev) =>
      prev.map((fruit) =>
        fruit.id === id ? { ...fruit, inStock: !fruit.inStock } : fruit,
      ),
    )
  }

  function removeFruit(id) {
    setFruits((prev) => prev.filter((fruit) => fruit.id !== id))
  }

  function toggleFilter() {
    setShowOnlyInStock((prev) => !prev)
  }

  const visibleFruits = showOnlyInStock
    ? fruits.filter((fruit) => fruit.inStock)
    : fruits

  return (
    <section className="practice">
      <h2>실습2: 과일 재고 목록 (useState / 이벤트 핸들링 / 리스트+key)</h2>

      <div className="actions">
        <button onClick={addRandomFruit}>랜덤 과일 추가</button>
        <button
          className={showOnlyInStock ? 'active' : ''}
          onClick={toggleFilter}
        >
          {showOnlyInStock ? '전체 보기' : '재고 있는 것만 보기'}
        </button>
      </div>

      {visibleFruits.length === 0 ? (
        <p>표시할 과일이 없습니다.</p>
      ) : (
        <ul className="fruit-list">
          {visibleFruits.map((fruit) => (
            <li key={fruit.id} className="fruit-card">
              <span className={`name${fruit.inStock ? '' : ' soldout'}`}>
                {fruit.name}
              </span>
              <div className="actions">
                <button onClick={() => toggleStock(fruit.id)}>
                  {fruit.inStock ? '품절 처리' : '재입고'}
                </button>
                <button onClick={() => removeFruit(fruit.id)}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default FruitInventoryPractice
