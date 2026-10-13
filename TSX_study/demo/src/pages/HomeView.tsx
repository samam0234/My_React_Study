import { useState } from 'react'
import FruitListPractice from '../components/FruitListPractice.tsx'
import FruitInventoryPractice from '../components/FruitInventoryPractice.tsx'
import FruitSearchPractice from '../components/FruitSearchPractice.tsx'
import LikeableFruitList from '../components/LikeableFruitList.tsx'
import LoginFormPractice from '../components/LoginFormPractice.tsx'

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
