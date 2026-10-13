import axios from 'axios'

// study7: 실제 백엔드가 없으므로 JSONPlaceholder(공개 목업 API)를 사용.
// 기업형 구조에서는 이 axios 인스턴스에 baseURL, 공통 헤더, 인터셉터(토큰 첨부, 401 처리)를 모아둔다.
export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
})
