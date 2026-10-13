import FruitCard from './FruitCard.jsx'

// study1: 아직 상태(state)는 다루지 않고, 그냥 고정된 배열을 props로 내려주는 것까지만 실습합니다.
// (interactive하게 만드는 건 study2에서 useState로 이어집니다.)
const initialFruits = [
  { id: 1, name: '사과', inStock: true },
  { id: 2, name: '바나나', inStock: false },
  { id: 3, name: '포도', inStock: true },
]

function FruitListPractice() {
  return (
    <section className="practice">
      <h2>실습1: 과일 재고 목록 (함수 컴포넌트 / props / children)</h2>
      <p>
        부모(FruitListPractice)가 배열을 갖고 있고, 각 항목을 자식(FruitCard)에게
        props로 하나씩 내려줍니다. FruitCard 안에서는 다시 FruitBadge를
        children과 함께 사용합니다.
      </p>
      <ul className="fruit-list">
        {initialFruits.map((fruit) => (
          <FruitCard key={fruit.id} fruit={fruit} />
        ))}
      </ul>
    </section>
  )
}

export default FruitListPractice
