import { useOutletContext } from 'react-router-dom'
import type { FruitOutletContext } from './FruitDetailLayout.tsx'

function FruitOverview() {
  const { fruit } = useOutletContext<FruitOutletContext>()
  return <p>{fruit.description}</p>
}

export default FruitOverview
