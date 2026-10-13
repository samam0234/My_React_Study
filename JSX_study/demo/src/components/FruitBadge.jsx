// children 실습: 태그 사이의 내용(문자열/엘리먼트)을 그대로 감싸서 보여주는 컴포넌트
function FruitBadge({ soldout, children }) {
  return (
    <span className={`badge${soldout ? ' soldout' : ''}`}>{children}</span>
  )
}

export default FruitBadge
