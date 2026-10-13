import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AppHeader from './components/AppHeader.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import PostListPage from './pages/PostListPage.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <AppHeader />
          <main>
            <Routes>
              <Route path="/" element={<PostListPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
