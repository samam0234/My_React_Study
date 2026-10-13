import { apiClient } from './client.js'

const LIMIT = 10

export async function fetchPosts() {
  const res = await apiClient.get('/posts', { params: { _limit: LIMIT } })
  return res.data
}

export async function fetchPost(id) {
  const res = await apiClient.get(`/posts/${id}`)
  return res.data
}
