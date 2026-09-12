import { apiClient } from './client.js'

// 페이지 단위로 게시글을 가져온다 (JSONPlaceholder의 _page/_limit 쿼리 파라미터 사용)
export async function fetchPosts({ page, limit }) {
  const res = await apiClient.get('/posts', {
    params: { _page: page, _limit: limit },
  })
  return res.data
}
