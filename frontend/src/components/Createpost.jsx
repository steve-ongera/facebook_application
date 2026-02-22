import React, { useState, useRef } from 'react'
import { useAuth } from '../App'
import { createPost } from '../services/api'
import Avatar from './Avatar'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [open, setOpen]         = useState(false)
  const [content, setContent]   = useState('')
  const [image, setImage]       = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const fileRef = useRef()

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!content.trim() && !image) return
    setLoading(true)
    try {
      const post = await createPost({ content, image })
      onPostCreated(post)
      setContent(''); setImage(null); setPreview(null); setOpen(false)
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <div className="card create-post">
      <div className="create-post__top">
        <div className="create-post__avatar"><Avatar user={user} /></div>
        {!open ? (
          <button className="create-post__trigger" onClick={() => setOpen(true)}>
            What's on your mind, {user?.first_name || user?.username}?
          </button>
        ) : (
          <span style={{ fontWeight: 700, fontSize: 17 }}>Create post</span>
        )}
      </div>

      {open && (
        <div className="create-post__form">
          <textarea
            autoFocus
            placeholder={`What's on your mind, ${user?.first_name || user?.username}?`}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          {preview && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img src={preview} alt="preview" style={{ width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'cover' }} />
              <button
                onClick={() => { setImage(null); setPreview(null) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}
              >✕</button>
            </div>
          )}
          <div className="create-post__actions">
            <div>
              <button className="create-post__media-btn" onClick={() => fileRef.current.click()} title="Add photo">📷</button>
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--gray btn--sm" onClick={() => { setOpen(false); setContent(''); setImage(null); setPreview(null) }}>Cancel</button>
              <button
                className="btn btn--primary btn--sm"
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && !image)}
              >
                {loading ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}