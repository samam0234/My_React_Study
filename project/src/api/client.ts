import axios from 'axios'

// studyFinal: study7/10에서 배운 axios 인스턴스 분리 패턴을 그대로 적용.
// 실제 백엔드가 생기면 baseURL만 바꾸면 되고, 그때는 study10에서 정리한 CORS 설정이 필요해짐.
export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
})
