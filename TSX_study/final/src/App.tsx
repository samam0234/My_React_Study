import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import './App.css'
import AppHeader from '@/components/AppHeader'
import ErrorFallback from '@/components/ErrorFallback'
import ProtectedRoute from '@/components/ProtectedRoute'
import SessionWatcher from '@/components/SessionWatcher'
import StateMessage from '@/components/StateMessage'
import Toaster from '@/components/Toaster'
import { logger } from '@/lib/logger'
import PostListPage from '@/pages/PostListPage'

// study12: 첫 화면(목록)은 정적 import, 나머지는 라우트 진입 시점에 내려받는다.
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'))
const PostFormPage = lazy(() => import('@/pages/PostFormPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const MyPage = lazy(() => import('@/pages/MyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Router 는 main.tsx(또는 테스트)에서 감싼다.
export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        본문으로 건너뛰기
      </a>
      <SessionWatcher />
      <AppHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 헤더는 살아 있고 본문만 오류 화면으로 대체된다 (study16) */}
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(e, info) => logger.error(e, info)}
        >
          <Suspense fallback={<StateMessage kind="loading">불러오는 중...</StateMessage>}>
            <Routes>
              <Route path="/" element={<PostListPage />} />
              <Route
                path="/posts/new"
                element={
                  <ProtectedRoute>
                    <PostFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route
                path="/posts/:id/edit"
                element={
                  <ProtectedRoute>
                    <PostFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/mypage"
                element={
                  <ProtectedRoute>
                    <MyPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Toaster />
    </>
  )
}
