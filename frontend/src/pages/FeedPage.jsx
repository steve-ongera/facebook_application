/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { getFeed } from '../services/api'   // named export — used inside useEffect below
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import Avatar from '../components/Avatar'

/* ── Skeleton loader ── */
function PostSkeleton() {
  return (
    <div className="post-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 6, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: '20%', height: 11, borderRadius: 6 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: 15, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '80%', height: 15, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '100%', height: 220, borderRadius: 10, marginTop: 12 }} />
    </div>
  )
}

/* ── Left sidebar ── */
function LeftSidebar({ user }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Profile quick-link */}
      <div
        className="sidebar-widget"
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => navigate(`/profile/${user?.id}`)}
      >
        <Avatar user={user} size={42} />
        <span style={{ fontWeight: 800, fontSize: 15 }}>
          {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
        </span>
      </div>

      {/* Quick links */}
      <div className="sidebar-widget">
        {[
          { icon: 'bi-people-fill',    label: 'Friends',    color: '#1877f2' },
          { icon: 'bi-chat-dots-fill', label: 'Messages',   color: '#1877f2', path: '/messages' },
          { icon: 'bi-bookmark-fill',  label: 'Saved',      color: '#8b5cf6' },
          { icon: 'bi-grid-fill',      label: 'Feed',       color: '#e45313', path: '/' },
        ].map(item => (
          <div
            key={item.label}
            className="sidebar-user"
            onClick={() => item.path && navigate(item.path)}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#e7f0ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, color: item.color
            }}>
              <i className={`bi ${item.icon}`} />
            </div>
            <span className="sidebar-user__name">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Right sidebar ── */
function RightSidebar() {
  return (
    <div>
      <div className="sidebar-widget">
        <div className="sidebar-widget__title">Contacts</div>
        <div style={{ color: 'var(--text-2)', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>
          <i className="bi bi-people" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: 'var(--border)' }} />
          Search for friends to message them
        </div>
      </div>

      <div className="sidebar-widget">
        <div className="sidebar-widget__title">Sponsored</div>
        <div style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--bg)', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          <i className="bi bi-megaphone" style={{ marginRight: 6 }} /> Ad space
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeed()
      .then(data => setPosts(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])  // stable module-level fn — safe empty dep array

  const handlePostCreated = (post) => setPosts(prev => [post, ...prev])
  const handlePostDeleted = (id)   => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div className="feed-wrap">
      {/* Left sidebar */}
      <div className="feed-sidebar">
        <LeftSidebar user={user} />
      </div>

      {/* Center feed */}
      <div className="feed-col">
        <CreatePost onPostCreated={handlePostCreated} />

        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <h3>Nothing here yet</h3>
              <p>Be the first to post something! Your story starts here.</p>
              <button className="btn btn--primary" style={{ marginTop: 8 }}>
                <i className="bi bi-pencil-square" /> Create Post
              </button>
            </div>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
          ))
        )}
      </div>

      {/* Right sidebar */}
      <div className="feed-sidebar">
        <RightSidebar />
      </div>
    </div>
  )
}