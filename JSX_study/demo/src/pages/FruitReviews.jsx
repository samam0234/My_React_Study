import { useOutletContext } from 'react-router-dom'

const mockReviews = ['달고 신선해요!', '가격 대비 만족스러워요.', '생각보다 크기가 작았어요.']

// study6: 두 번째 자식 라우트. 같은 부모 레이아웃(FruitDetailLayout) 아래에서
// URL만 "/fruits/:id/reviews"로 바뀌면 이 컴포넌트로 교체된다.
function FruitReviews() {
  const { fruit } = useOutletContext()
  return (
    <ul className="fruit-list">
      {mockReviews.map((review, index) => (
        <li key={`${fruit.id}-${index}`} className="fruit-card">
          <span>{review}</span>
        </li>
      ))}
    </ul>
  )
}

export default FruitReviews
