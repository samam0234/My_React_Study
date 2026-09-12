import { useState, type MouseEvent } from 'react'

interface SimpleFruit {
  id: number
  name: string
}

const fruits: SimpleFruit[] = [
  { id: 1, name: '사과' },
  { id: 2, name: '바나나' },
  { id: 3, name: '포도' },
]

interface FruitLikeCardProps {
  fruit: SimpleFruit
  liked: boolean
  onSelect: (id: number) => void
  onToggleLike: (id: number) => void
}

function FruitLikeCard({ fruit, liked, onSelect, onToggleLike }: FruitLikeCardProps) {
  function handleLikeClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggleLike(fruit.id)
  }

  return (
    <li className="fruit-card" onClick={() => onSelect(fruit.id)}>
      <span className="name">{fruit.name}</span>
      <button className={liked ? 'active' : ''} onClick={handleLikeClick}>
        {liked ? '★ 좋아요 취소' : '☆ 좋아요'}
      </button>
    </li>
  )
}

function LikeableFruitList() {
  const [likedIds, setLikedIds] = useState<number[]>([])
  const [lastSelected, setLastSelected] = useState<number | null>(null)

  function handleToggleLike(id: number) {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((likedId) => likedId !== id) : [...prev, id],
    )
  }

  function handleSelect(id: number) {
    setLastSelected(id)
  }

  return (
    <section className="practice">
      <h2>실습4-1: 콜백 props로 자식 → 부모 통신</h2>
      <p>
        카드를 클릭하면 부모가 &quot;선택됨&quot;을 기록하고, 좋아요 버튼을
        클릭하면 카드 선택과 별개로 좋아요 상태만 토글됩니다 (이벤트 버블링
        차단 실습).
      </p>
      <ul className="fruit-list">
        {fruits.map((fruit) => (
          <FruitLikeCard
            key={fruit.id}
            fruit={fruit}
            liked={likedIds.includes(fruit.id)}
            onSelect={handleSelect}
            onToggleLike={handleToggleLike}
          />
        ))}
      </ul>
      <p>
        마지막으로 선택한 카드:{' '}
        <b>{fruits.find((f) => f.id === lastSelected)?.name ?? '없음'}</b> /
        좋아요한 과일 개수: <b>{likedIds.length}</b>개
      </p>
    </section>
  )
}

export default LikeableFruitList
