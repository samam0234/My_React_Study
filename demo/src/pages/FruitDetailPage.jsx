import { useParams, useNavigate, Link } from 'react-router-dom'
import { fruitCatalog } from '../data/fruitCatalog.js'

// study5: 상세 페이지. URL의 동적 파라미터(:id)로 어떤 데이터를 보여줄지 결정.
function FruitDetailPage() {
  const { id } = useParams() // URL 문자열이라 숫자 비교 시 Number()로 변환 필요
  const navigate = useNavigate()

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
      <p>{fruit.description}</p>
      <p>가격: {fruit.price.toLocaleString()}원</p>
      <div className="actions">
        <Link to="/fruits">← 목록으로 (Link)</Link>
        <button onClick={() => navigate(-1)}>← 뒤로가기 (useNavigate)</button>
      </div>
    </section>
  )
}

export default FruitDetailPage
