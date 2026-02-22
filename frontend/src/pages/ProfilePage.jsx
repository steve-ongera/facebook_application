import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { getUser, getUserPosts, deletePost, getCurrentUser } from '../services/api'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: me, setUser } = useAuth()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const isMe = me?.id === Number(id)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUser(id),
      // DRF pagination may wrap in results
      fetch(`http://localhost:8000/api/posts/?author=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      }).then(r => r.json())
    ]).then(([user, postsData]) => {
      setProfileUser(user)
      setPosts(Array.isArray(postsData) ? postsData : postsData.results || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handlePostDeleted = (postId) => setPosts(prev => prev.filter(p => p.id !== postId))

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!profileUser) return <div className="container" style={{ paddingTop: 30 }}>User not found.</div>

  return (
    <div>
      {/* Cover */}
      <div className="profile-cover" />

      {/* Header Card */}
      <div style={{ maxWidth: 860, margin: '-20px auto 0', padding: '0 16px 16px' }}>
        <div className="card" style={{ padding: '0 24px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -60 }}>
            <div className="profile-avatar">
              <Avatar user={profileUser} />
            </div>
            <div className="profile-info" style={{ flex: 1 }}>
              <h2>{profileUser.first_name} {profileUser.last_name} <span style={{ fontWeight: 400, color: '#65676b' }}>@{profileUser.username}</span></h2>
              {profileUser.bio && <p className="bio">{profileUser.bio}</p>}
              <p className="friends-count">{profileUser.friends_count} friends</p>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {!isMe && (
                <button className="btn btn--primary btn--sm" onClick={() => navigate(`/messages/${profileUser.id}`)}>
                  💬 Message
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Posts</h3>
          {posts.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: '#65676b' }}>
              No posts yet.
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}