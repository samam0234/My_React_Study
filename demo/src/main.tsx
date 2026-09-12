import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// study10: getElementById는 요소를 못 찾으면 null을 반환할 수 있어서,
// TS는 "! (non-null assertion)"로 "이 값은 절대 null이 아니라고 단언"하지 않으면 타입 에러를 낸다.
// index.html에 <div id="root">가 항상 있다는 걸 우리가 보장하므로 여기서는 안전하게 사용.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
