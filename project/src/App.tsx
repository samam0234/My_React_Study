import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import AppHeader from './components/AppHeader.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import PostListPage from './pages/PostListPage.tsx'
import PostDetailPage from './pages/PostDetailPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyPage from './pages/MyPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppHeader />
        <main>
          <Routes>
            <Route path="/" element={<PostListPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
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
