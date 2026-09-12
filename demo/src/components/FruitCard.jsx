import FruitBadge from './FruitBadge.jsx'

// props 실습: 부모(FruitListPractice)가 내려준 fruit 객체 하나를 그려주기만 하는 자식 컴포넌트
function FruitCard({ fruit }) {
  return (
    <li className="fruit-card">
      <span className={`name${fruit.inStock ? '' : ' soldout'}`}>
        {fruit.name}
      </span>
      <FruitBadge soldout={!fruit.inStock}>
        {fruit.inStock ? '재고 있음' : '품절'}
      </FruitBadge>
    </li>
  )
}

export default FruitCard
