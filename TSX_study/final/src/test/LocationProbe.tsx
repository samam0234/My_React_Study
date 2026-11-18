import { useLocation } from 'react-router-dom'

/** 테스트에서 현재 경로(pathname + search)를 화면에 노출해 이동 결과를 검증한다. */
export function LocationProbe() {
  const loc = useLocation()
  return <p data-testid="location">{loc.pathname + loc.search}</p>
}
