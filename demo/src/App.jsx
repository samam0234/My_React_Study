import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import HomeView from './pages/HomeView.jsx'
import FruitCatalogPage from './pages/FruitCatalogPage.jsx'
import FruitDetailPage from './pages/FruitDetailPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>React 학습 데모</h1>
          <p>study1부터 하나씩 실습 컴포넌트를 이 화면에 쌓아갑니다.</p>
          <nav className="actions">
            <Link to="/">홈 (study1~4 실습)</Link>
            <Link to="/fruits">과일 카탈로그 (study5 라우팅 실습)</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/fruits" element={<FruitCatalogPage />} />
            <Route path="/fruits/:id" element={<FruitDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
