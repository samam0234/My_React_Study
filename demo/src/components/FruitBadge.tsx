import type { ReactNode } from 'react'

interface FruitBadgeProps {
  soldout: boolean
  children: ReactNode
}

function FruitBadge({ soldout, children }: FruitBadgeProps) {
  return (
    <span className={`badge${soldout ? ' soldout' : ''}`}>{children}</span>
  )
}

export default FruitBadge
