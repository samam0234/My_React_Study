import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import HomeView from './pages/HomeView.jsx'
import FruitCatalogPage from './pages/FruitCatalogPage.jsx'
import FruitDetailLayout from './pages/FruitDetailLayout.jsx'
import FruitOverview from './pages/FruitOverview.jsx'
import FruitReviews from './pages/FruitReviews.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyPage from './pages/MyPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>React 학습 데모</h1>
          <p>study1부터 하나씩 실습 컴포넌트를 이 화면에 쌓아갑니다.</p>
          <nav className="actions">
            <Link to="/">홈</Link>
            <Link to="/fruits">과일 카탈로그</Link>
            <Link to="/mypage">마이페이지 (보호됨)</Link>
            <Link to="/login">로그인</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/fruits" element={<FruitCatalogPage />} />

            {/* 중첩 라우팅: FruitDetailLayout 아래에 index / reviews 두 자식 라우트 */}
            <Route path="/fruits/:id" element={<FruitDetailLayout />}>
              <Route index element={<FruitOverview />} />
              <Route path="reviews" element={<FruitReviews />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
