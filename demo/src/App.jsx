import { useState } from 'react'
import './App.css'
import FruitListPractice from './components/FruitListPractice.jsx'
import FruitInventoryPractice from './components/FruitInventoryPractice.jsx'
import FruitSearchPractice from './components/FruitSearchPractice.jsx'
import LikeableFruitList from './components/LikeableFruitList.jsx'
import LoginFormPractice from './components/LoginFormPractice.jsx'

function App() {
  const [showSearch, setShowSearch] = useState(true)

  return (
    <div className="app">
      <header>
        <h1>React 학습 데모</h1>
        <p>study1부터 하나씩 실습 컴포넌트를 이 화면에 쌓아갑니다.</p>
      </header>

      <main>
        <FruitListPractice />
        <FruitInventoryPractice />

        <div className="actions">
          <button onClick={() => setShowSearch((prev) => !prev)}>
            {showSearch ? '검색 컴포넌트 언마운트' : '검색 컴포넌트 다시 마운트'}
          </button>
        </div>
        {/* 버튼으로 마운트/언마운트를 반복시켜 useEffect의 클린업 함수 호출을
            콘솔에서 확인할 수 있게 함 */}
        {showSearch && <FruitSearchPractice />}

        <LikeableFruitList />
        <LoginFormPractice />
      </main>
    </div>
  )
}

export default App
