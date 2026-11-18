import { useEffect, useState } from 'react'

/** 값이 바뀐 뒤 delay ms 동안 더 안 바뀌면 그때 반영 (study3 디바운스를 훅으로) */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
