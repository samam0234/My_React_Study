import { useEffect, useRef, useState } from 'react'

const allFruits = ['사과', '바나나', '포도', '수박', '딸기', '망고', '체리', '자두']

function FruitSearchPractice() {
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const renderCount = useRef(0)

  useEffect(() => {
    console.log('[FruitSearchPractice] 마운트됨 → input에 자동 포커스')
    inputRef.current?.focus()

    return () => {
      console.log('[FruitSearchPractice] 언마운트됨')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 300)

    return () => clearTimeout(timer)
  }, [keyword])

  renderCount.current += 1

  const results = allFruits.filter((fruit) => fruit.includes(debouncedKeyword))

  return (
    <section className="practice">
      <h2>실습3: 과일 검색 (useEffect / useRef)</h2>
      <input
        ref={inputRef}
        type="text"
        placeholder="과일 이름을 입력하세요 (예: 사)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <p>
        입력값: <b>{keyword || '(없음)'}</b> / 검색 반영값(300ms 디바운스):{' '}
        <b>{debouncedKeyword || '(없음)'}</b>
      </p>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        이 컴포넌트는 지금까지 {renderCount.current}번 렌더링되었습니다 (useRef는
        값이 바뀌어도 리렌더링을 일으키지 않습니다).
      </p>
      <ul className="fruit-list">
        {results.map((fruit) => (
          <li key={fruit} className="fruit-card">
            <span className="name">{fruit}</span>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p>검색 결과가 없습니다.</p>}
    </section>
  )
}

export default FruitSearchPractice
