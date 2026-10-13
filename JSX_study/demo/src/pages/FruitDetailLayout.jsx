import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { fruitCatalog } from '../data/fruitCatalog.js'

// study6: 중첩 라우팅의 "부모" 페이지. 공통 정보(이름/가격/탭 네비게이션)만 그리고,
// 실제 하위 화면은 <Outlet />이 있는 자리에 자식 라우트가 채워 넣는다.
function FruitDetailLayout() {
  const { id } = useParams()
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
        {/* end 없이 쓰면 "/fruits/1"이 "/fruits/1/reviews"에도 매칭되어 항상 active로 보임 */}
        <NavLink to="." end className={({ isActive }) => (isActive ? 'active' : '')}>
          개요
        </NavLink>
        <NavLink to="reviews" className={({ isActive }) => (isActive ? 'active' : '')}>
          리뷰
        </NavLink>
      </nav>

      {/* 자식 라우트(FruitOverview 또는 FruitReviews)가 그려지는 자리 */}
      <Outlet context={{ fruit }} />

      <Link to="/fruits">← 목록으로</Link>
    </section>
  )
}

export default FruitDetailLayout
