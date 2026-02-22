import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { likePost, deletePost, addComment, deleteComment } from '../services/api'
import Avatar from './Avatar'

const BASE = 'http://localhost:8000'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [liked, setLiked]           = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [comments, setComments]     = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const menuRef = useRef(null)

  const isOwner = user?.id === post.author?.id

  /* Close menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = async () => {
    try {
      const data = await likePost(post.id)
      setLiked(data.liked)
      setLikesCount(data.likes_count)
    } catch {}
  }

  const handleDelete = async () => {
    setShowMenu(false)
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(post.id)
      onDelete(post.id)
    } catch {}
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const c = await addComment(post.id, commentText)
      setComments(prev => [...prev, c])
      setCommentText('')
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  const imgSrc = post.image
    ? (post.image.startsWith('http') ? post.image : `${BASE}${post.image}`)
    : null

  return (
    <div className="post-card">
      {/* ── Header ── */}
      <div className="post-card__header">
        <div
          className="post-card__avatar"
          onClick={() => navigate(`/profile/${post.author.id}`)}
        >
          <Avatar user={post.author} size={42} />
        </div>

        <div className="post-card__meta">
          <span
            className="post-card__name"
            onClick={() => navigate(`/profile/${post.author.id}`)}
          >
            {post.author.first_name
              ? `${post.author.first_name} ${post.author.last_name || ''}`
              : post.author.username}
          </span>
          <div className="post-card__time">
            <i className="bi bi-globe" style={{ fontSize: 11 }} />
            {timeAgo(post.created_at)}
          </div>
        </div>

        {/* More options */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className="post-card__more"
            onClick={() => setShowMenu(!showMenu)}
          >
            <i className="bi bi-three-dots" />
          </button>
          {showMenu && (
            <div className="post-menu">
              <div
                className="post-menu__item"
                onClick={() => { navigate(`/profile/${post.author.id}`); setShowMenu(false) }}
              >
                <i className="bi bi-person" />
                View profile
              </div>
              {isOwner && (
                <div className="post-menu__item post-menu__item--danger" onClick={handleDelete}>
                  <i className="bi bi-trash" />
                  Delete post
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {post.content && (
        <div
          className={`post-card__content ${post.content.length < 80 && !imgSrc ? 'post-card__content--large' : ''}`}
        >
          {post.content}
        </div>
      )}

      {/* ── Image ── */}
      {imgSrc && (
        <img className="post-card__image" src={imgSrc} alt="post" loading="lazy" />
      )}

      {/* ── Stats ── */}
      {(likesCount > 0 || comments.length > 0) && (
        <div className="post-card__stats">
          {likesCount > 0 && (
            <div className="post-card__stats-likes">
              <span className="like-icon">👍</span>
              {likesCount}
            </div>
          )}
          {comments.length > 0 && (
            <span
              className="post-card__stats-comments"
              onClick={() => setShowComments(!showComments)}
            >
              {comments.length} comment{comments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="post-card__divider" />
      <div className="post-card__actions">
        <button
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <i className={`bi bi-hand-thumbs-up${liked ? '-fill' : ''}`} />
          Like
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <i className="bi bi-chat" />
          Comment
        </button>
        <button className="action-btn">
          <i className="bi bi-share" />
          Share
        </button>
      </div>

      {/* ── Comments ── */}
      {showComments && (
        <>
          <div className="post-card__divider" />
          <div className="comments-section">
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div
                  className="comment-item__avatar"
                  onClick={() => navigate(`/profile/${comment.author.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Avatar user={comment.author} size={32} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="comment-item__bubble">
                    <div
                      className="comment-item__author"
                      onClick={() => navigate(`/profile/${comment.author.id}`)}
                    >
                      {comment.author.first_name || comment.author.username}
                    </div>
                    <div className="comment-item__text">{comment.content}</div>
                  </div>
                  <div className="comment-item__footer">
                    <button className="comment-item__action">Like</button>
                    <button className="comment-item__action">Reply</button>
                    {(user?.id === comment.author.id || isOwner) && (
                      <button
                        className="comment-item__action comment-item__action--danger"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                    <span className="comment-item__time">{timeAgo(comment.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Comment input */}
            <form className="comment-form" onSubmit={handleComment}>
              <Avatar user={user} size={32} />
              <div className="comment-form__input-row">
                <input
                  className="comment-form__input"
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="comment-form__send"
                  disabled={!commentText.trim()}
                >
                  <i className="bi bi-send-fill" />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}