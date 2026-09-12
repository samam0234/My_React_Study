import { useOutletContext } from 'react-router-dom'

// study6: 자식 라우트(index route). 부모(FruitDetailLayout)의 <Outlet context={...}>로
// 넘겨받은 값을 useOutletContext()로 꺼내 쓴다 — props 전달과 달리, 라우트 트리를 통해 전달됨.
function FruitOverview() {
  const { fruit } = useOutletContext()
  return <p>{fruit.description}</p>
}

export default FruitOverview
