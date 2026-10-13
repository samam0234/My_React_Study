import { useEffect, useState } from 'react'

// study7: "로딩/에러/데이터"를 매번 컴포넌트마다 반복해서 관리하지 않도록 만든 커스텀 훅.
// fetcher: 데이터를 가져오는 비동기 함수. deps: 이 값들이 바뀌면 다시 요청.
export function useFetch(fetcher, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false // 언마운트되었거나 더 최신 요청이 들어온 뒤에는 결과를 반영하지 않기 위한 플래그

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
