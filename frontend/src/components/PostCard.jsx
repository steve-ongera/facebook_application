import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { likePost, deletePost, addComment, deleteComment } from '../services/api'
import Avatar from './Avatar'

const BASE = 'http://localhost:8000'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked]         = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [comments, setComments]   = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [submitting, setSubmitting]     = useState(false)

  const handleLike = async () => {
    try {
      const data = await likePost(post.id)
      setLiked(data.liked)
      setLikesCount(data.likes_count)
    } catch {}
  }

  const handleDelete = async () => {
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
      const newComment = await addComment(post.id, commentText)
      setComments(prev => [...prev, newComment])
      setCommentText('')
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  const isOwner = user?.id === post.author?.id

  return (
    <div className="card post-card">
      {/* Header */}
      <div className="post-card__header">
        <div className="post-card__avatar" onClick={() => navigate(`/profile/${post.author.id}`)}>
          <Avatar user={post.author} />
        </div>
        <div className="post-card__meta">
          <div className="post-card__name" onClick={() => navigate(`/profile/${post.author.id}`)}>
            {post.author.first_name || post.author.username}
          </div>
          <div className="post-card__time">{timeAgo(post.created_at)}</div>
        </div>
        {isOwner && (
          <button className="post-card__delete" onClick={handleDelete} title="Delete post">✕</button>
        )}
      </div>

      {/* Content */}
      <div className="post-card__content">{post.content}</div>

      {/* Image */}
      {post.image && (
        <img
          className="post-card__image"
          src={post.image.startsWith('http') ? post.image : `${BASE}${post.image}`}
          alt="post"
        />
      )}

      {/* Stats */}
      {(likesCount > 0 || comments.length > 0) && (
        <div className="post-card__stats">
          {likesCount > 0 && <span>👍 {likesCount}</span>}
          {comments.length > 0 && (
            <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(!showComments)}>
              {comments.length} comment{comments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="post-card__actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          👍 Like
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          💬 Comment
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-item__avatar">
                <Avatar user={comment.author} />
              </div>
              <div className="comment-item__bubble">
                <div className="comment-item__author">{comment.author.username}</div>
                <div className="comment-item__text">{comment.content}</div>
              </div>
              {(user?.id === comment.author.id || isOwner) && (
                <button
                  className="comment-item__delete"
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Delete comment"
                >✕</button>
              )}
            </div>
          ))}
          {/* Comment Form */}
          <form className="comment-form" onSubmit={handleComment}>
            <div className="comment-form__avatar"><Avatar user={user} /></div>
            <input
              placeholder="Write a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={submitting}
            />
          </form>
        </div>
      )}
    </div>
  )
}