import { useOutletContext } from 'react-router-dom'
import type { FruitOutletContext } from './FruitDetailLayout.tsx'

const mockReviews = ['달고 신선해요!', '가격 대비 만족스러워요.', '생각보다 크기가 작았어요.']

function FruitReviews() {
  const { fruit } = useOutletContext<FruitOutletContext>()
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
