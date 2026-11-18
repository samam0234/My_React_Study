// 환경 변수는 이 파일 한 곳에서만 읽는다 (study8).
export const config = {
  /** '' 이면 같은 출처(/api)로 호출 — 개발은 Vite 프록시, 운영은 Nginx (CORS 불필요) */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isProd: import.meta.env.PROD,
} as const
