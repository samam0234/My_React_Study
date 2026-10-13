export interface CatalogFruit {
  id: number
  name: string
  description: string
  price: number
}

// study10: 예전엔 이 배열의 각 항목이 정확히 어떤 필드를 가져야 하는지 주석으로만 알 수 있었지만,
// CatalogFruit 타입을 지정하면 필드 이름 오타나 누락을 컴파일 시점에 바로 잡아낼 수 있다.
export const fruitCatalog: CatalogFruit[] = [
  { id: 1, name: '사과', description: '아삭하고 새콤달콤한 대표 과일.', price: 3000 },
  { id: 2, name: '바나나', description: '부드럽고 달아서 아침 대용으로 좋음.', price: 2500 },
  { id: 3, name: '포도', description: '씨 없는 품종이 인기가 많음.', price: 8000 },
  { id: 4, name: '수박', description: '여름 대표 과일, 수분 함량이 매우 높음.', price: 15000 },
]
