const BASE_URL = 'http://localhost:8000/api'

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token')
  const headers = { ...options.headers }

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (res.status === 401) {
    // Try token refresh
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        localStorage.setItem('access_token', data.access)
        headers['Authorization'] = `Bearer ${data.access}`
        const retry = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
        if (!retry.ok) throw new Error(await retry.text())
        return retry.status === 204 ? null : retry.json()
      }
    }
    localStorage.clear()
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(JSON.stringify(err))
  }
  return res.status === 204 ? null : res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) })

export const register = (data) =>
  request('/auth/register/', { method: 'POST', body: JSON.stringify(data) })

export const getCurrentUser = () => request('/users/me/')

export const updateProfile = (data) => {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) form.append(k, v) })
  return request('/users/me/', { method: 'PATCH', body: form })
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const searchUsers = (q) => request(`/users/search/?q=${encodeURIComponent(q)}`)
export const getUser = (id) => request(`/users/${id}/`)

// ─── Posts ────────────────────────────────────────────────────────────────────
export const getFeed = () => request('/posts/feed/')
export const getUserPosts = (userId) => request(`/posts/?author=${userId}`)

export const createPost = (data) => {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v) form.append(k, v) })
  return request('/posts/', { method: 'POST', body: form })
}

export const deletePost = (id) => request(`/posts/${id}/`, { method: 'DELETE' })

export const likePost = (id) => request(`/posts/${id}/like/`, { method: 'POST' })

// ─── Comments ─────────────────────────────────────────────────────────────────
export const addComment = (postId, content) =>
  request(`/posts/${postId}/comment/`, { method: 'POST', body: JSON.stringify({ content }) })

export const deleteComment = (id) => request(`/comments/${id}/`, { method: 'DELETE' })

// ─── Messages ─────────────────────────────────────────────────────────────────
export const getConversations = () => request('/messages/conversations/')
export const getMessages = (userId) => request(`/messages/?with=${userId}`)
export const sendMessage = (receiverId, content) =>
  request('/messages/', { method: 'POST', body: JSON.stringify({ receiver_id: receiverId, content }) })