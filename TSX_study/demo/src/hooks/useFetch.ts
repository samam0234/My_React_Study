import { useEffect, useState } from 'react'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

// study10: 제네릭(<T>)으로 "이 훅이 어떤 타입의 데이터를 다루는지"를 호출하는 쪽에서 지정할 수 있게 함.
// useFetch<Post[]>(...)처럼 쓰면 data의 타입이 Post[] | null로 추론된다.
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err : new Error(String(err)))
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
