import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { getUser } from '../services/api'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'

const BASE = 'http://localhost:8000'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState('posts')

  const isMe = me?.id === Number(id)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUser(id),
      fetch(`${BASE}/api/posts/?author=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      }).then(r => r.json())
    ])
      .then(([u, postsData]) => {
        setProfileUser(u)
        setPosts(Array.isArray(postsData) ? postsData : postsData.results || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handlePostDeleted = (postId) => setPosts(prev => prev.filter(p => p.id !== postId))

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!profileUser) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h3>User not found</h3>
            <p>This profile may not exist or has been removed.</p>
            <button className="btn btn--primary" onClick={() => navigate('/')}>
              <i className="bi bi-house" /> Back to Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fullName = profileUser.first_name
    ? `${profileUser.first_name} ${profileUser.last_name || ''}`
    : profileUser.username

  return (
    <div>
      {/* ── Cover ── */}
      <div className="profile-cover" />

      {/* ── Identity bar ── */}
      <div className="profile-info-bar">
        <div className="profile-identity">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <Avatar user={profileUser} size={160} />
          </div>

          {/* Info */}
          <div className="profile-details">
            <h1 className="profile-name">{fullName}</h1>
            <div className="profile-handle">@{profileUser.username}</div>
            {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
            <div className="profile-counts">
              <div className="profile-count">
                <div className="profile-count__num">{posts.length}</div>
                <div className="profile-count__label">Posts</div>
              </div>
              <div className="profile-count">
                <div className="profile-count__num">{profileUser.friends_count ?? 0}</div>
                <div className="profile-count__label">Friends</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions-row">
            {isMe ? (
              <>
                <button className="btn btn--primary">
                  <i className="bi bi-plus-lg" /> Add to story
                </button>
                <button className="btn btn--gray">
                  <i className="bi bi-pencil" /> Edit profile
                </button>
              </>
            ) : (
              <>
                <button className="btn btn--primary">
                  <i className="bi bi-person-plus" /> Add Friend
                </button>
                <button
                  className="btn btn--gray"
                  onClick={() => navigate(`/messages/${profileUser.id}`)}
                >
                  <i className="bi bi-chat" /> Message
                </button>
                <button className="btn btn--gray">
                  <i className="bi bi-three-dots" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile tabs */}
        <div className="profile-nav-tabs">
          {['posts', 'about', 'friends', 'photos'].map(tab => (
            <button
              key={tab}
              className={`profile-nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="profile-body">

        {/* Left — About */}
        <div>
          <div className="about-card">
            <h3>Intro</h3>
            {profileUser.bio ? (
              <p style={{ fontSize: 15, marginBottom: 14, lineHeight: 1.6 }}>{profileUser.bio}</p>
            ) : (
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14 }}>
                {isMe ? 'Add a bio to tell people about yourself.' : 'No bio yet.'}
              </p>
            )}
            <div className="about-item">
              <i className="bi bi-envelope" />
              {profileUser.email || 'No email shared'}
            </div>
            <div className="about-item">
              <i className="bi bi-calendar3" />
              Joined {new Date(profileUser.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="about-item">
              <i className="bi bi-people" />
              {profileUser.friends_count ?? 0} friends
            </div>
            {isMe && (
              <button className="btn btn--gray btn--full" style={{ marginTop: 14 }}>
                <i className="bi bi-pencil" /> Edit details
              </button>
            )}
          </div>

          {/* Friends mini-widget */}
          <div className="about-card" style={{ marginTop: 12 }}>
            <h3>Friends</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              {profileUser.friends_count ?? 0} friends
            </p>
          </div>
        </div>

        {/* Right — Posts */}
        <div>
          {posts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state__icon">📝</div>
                <h3>No posts yet</h3>
                <p>
                  {isMe
                    ? 'Share your first post with the world!'
                    : `${profileUser.first_name || profileUser.username} hasn't posted yet.`}
                </p>
              </div>
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