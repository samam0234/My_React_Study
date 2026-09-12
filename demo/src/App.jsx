import './App.css'
import FruitListPractice from './components/FruitListPractice.jsx'

function App() {
  return (
    <div className="app">
      <header>
        <h1>React 학습 데모</h1>
        <p>study1부터 하나씩 실습 컴포넌트를 이 화면에 쌓아갑니다.</p>
      </header>

      <main>
        <FruitListPractice />
      </main>
    </div>
  )
}

export default App
