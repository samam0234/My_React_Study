import FruitBadge from './FruitBadge.tsx'
import type { StockFruit } from '../types.ts'

interface FruitCardProps {
  fruit: StockFruit
}

function FruitCard({ fruit }: FruitCardProps) {
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
