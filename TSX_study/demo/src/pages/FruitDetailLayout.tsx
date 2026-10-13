import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { fruitCatalog, type CatalogFruit } from '../data/fruitCatalog.ts'

// 자식 라우트(FruitOverview, FruitReviews)와 공유하는 Outlet context의 타입
export interface FruitOutletContext {
  fruit: CatalogFruit
}

function FruitDetailLayout() {
  const { id } = useParams<{ id: string }>()
  const fruit = fruitCatalog.find((f) => f.id === Number(id))

  if (!fruit) {
    return (
      <section className="practice">
        <h2>존재하지 않는 과일입니다 (id: {id})</h2>
        <Link to="/fruits">← 목록으로</Link>
      </section>
    )
  }

  return (
    <section className="practice">
      <h2>{fruit.name}</h2>
      <p>가격: {fruit.price.toLocaleString()}원</p>

      <nav className="actions">
        <NavLink to="." end className={({ isActive }) => (isActive ? 'active' : '')}>
          개요
        </NavLink>
        <NavLink to="reviews" className={({ isActive }) => (isActive ? 'active' : '')}>
          리뷰
        </NavLink>
      </nav>

      <Outlet context={{ fruit } satisfies FruitOutletContext} />

      <Link to="/fruits">← 목록으로</Link>
    </section>
  )
}

export default FruitDetailLayout
