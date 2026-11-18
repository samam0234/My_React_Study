import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// 개발/preview 서버 프록시: 브라우저에는 같은 출처(/api)로 보이게 해 CORS를 우회한다 (study6).
// 운영에서는 Nginx가 같은 일을 한다 (study17).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = { target: env.DEV_PROXY_TARGET ?? 'http://localhost:8080', changeOrigin: true }
  const proxy = { '/api': api }

  return {
    plugins: [react(), tailwindcss()],
    // 개발 서버가 lazy 라우트에서 의존성을 뒤늦게 발견해 페이지를 다시 로드(입력값 소실)하지 않도록 미리 번들링한다.
    optimizeDeps: {
      include: [
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'zod',
        'zustand',
        'zustand/middleware',
        'clsx',
        'react-error-boundary',
      ],
    },
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: false,
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'text'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
      },
    },
  }
})
