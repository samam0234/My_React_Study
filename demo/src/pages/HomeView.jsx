import { useState } from 'react'
import FruitListPractice from '../components/FruitListPractice.jsx'
import FruitInventoryPractice from '../components/FruitInventoryPractice.jsx'
import FruitSearchPractice from '../components/FruitSearchPractice.jsx'
import LikeableFruitList from '../components/LikeableFruitList.jsx'
import LoginFormPractice from '../components/LoginFormPractice.jsx'

// study1~4에서 쌓아온 실습 컴포넌트들을 모아둔 홈 페이지.
// study5부터는 라우팅이 생겨서 App.jsx가 "여러 페이지 중 하나"로 이 컴포넌트를 보여줌.
function HomeView() {
  const [showSearch, setShowSearch] = useState(true)

  return (
    <>
      <FruitListPractice />
      <FruitInventoryPractice />

      <div className="actions">
        <button onClick={() => setShowSearch((prev) => !prev)}>
          {showSearch ? '검색 컴포넌트 언마운트' : '검색 컴포넌트 다시 마운트'}
        </button>
      </div>
      {showSearch && <FruitSearchPractice />}

      <LikeableFruitList />
      <LoginFormPractice />
    </>
  )
}

export default HomeView
