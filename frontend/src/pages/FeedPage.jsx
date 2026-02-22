/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { getFeed } from '../services/api'   // named export — used inside useEffect below
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'

export default function FeedPage() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeed()
      .then(data => setPosts(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])  // stable module-level function — safe to omit from deps

  const handlePostCreated = (newPost) => setPosts(prev => [newPost, ...prev])
  const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <CreatePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#65676b' }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ marginTop: 12, fontSize: 16 }}>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
        ))
      )}
    </div>
  )
}