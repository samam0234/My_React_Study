import { Link } from 'react-router-dom'
import { fruitCatalog } from '../data/fruitCatalog.ts'

function FruitCatalogPage() {
  return (
    <section className="practice">
      <h2>실습5: 과일 카탈로그 (목록 → 상세 라우팅)</h2>
      <ul className="fruit-list">
        {fruitCatalog.map((fruit) => (
          <li key={fruit.id} className="fruit-card">
            <Link to={`/fruits/${fruit.id}`}>{fruit.name}</Link>
            <span>{fruit.price.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FruitCatalogPage
