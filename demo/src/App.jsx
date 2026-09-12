import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext.jsx'
import AuthStatus from './components/AuthStatus.jsx'
import HomeView from './pages/HomeView.jsx'
import FruitCatalogPage from './pages/FruitCatalogPage.jsx'
import FruitDetailLayout from './pages/FruitDetailLayout.jsx'
import FruitOverview from './pages/FruitOverview.jsx'
import FruitReviews from './pages/FruitReviews.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyPage from './pages/MyPage.jsx'
import PostListPage from './pages/PostListPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    // study8: AuthProvider가 BrowserRouter까지 감싸서, 모든 페이지가 useAuth()를 쓸 수 있게 함
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <header>
            <h1>React 학습 데모</h1>
            <p>study1부터 하나씩 실습 컴포넌트를 이 화면에 쌓아갑니다.</p>
            <AuthStatus />
            <nav className="actions">
              <Link to="/">홈</Link>
              <Link to="/fruits">과일 카탈로그</Link>
              <Link to="/mypage">마이페이지 (보호됨)</Link>
              <Link to="/login">로그인</Link>
              <Link to="/posts">게시글 목록 (API)</Link>
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
              <Route path="/posts" element={<PostListPage />} />
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
    </AuthProvider>
  )
}

export default App
