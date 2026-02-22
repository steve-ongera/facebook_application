import React, { useState, useRef } from 'react'
import { useAuth } from '../App'
import { createPost } from '../services/api'
import Avatar from './Avatar'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [open, setOpen]       = useState(false)
  const [content, setContent] = useState('')
  const [image, setImage]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const textRef = useRef()

  const openForm = () => {
    setOpen(true)
    setTimeout(() => textRef.current?.focus(), 60)
  }

  const handleImage = (e) => {
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setOpen(false); setContent(''); setImage(null); setPreview(null)
  }

  const name = user?.first_name || user?.username || 'you'

  return (
    <div className="create-post">
      {/* Top row — always visible */}
      <div className="create-post__row">
        <Avatar user={user} size={42} />
        {!open ? (
          <button className="create-post__trigger" onClick={openForm}>
            What's on your mind, {name}?
          </button>
        ) : (
          <span style={{ fontWeight: 800, fontSize: 16, flex: 1 }}>Create post</span>
        )}
      </div>

      {/* Shortcuts (collapsed) */}
      {!open && (
        <>
          <div className="create-post__divider" />
          <div className="create-post__shortcuts">
            <button className="create-post__shortcut" onClick={() => { openForm(); fileRef.current?.click() }}>
              <i className="bi bi-image" style={{ color: '#45bd62' }} />
              Photo / Video
            </button>
            <button className="create-post__shortcut" onClick={openForm}>
              <i className="bi bi-emoji-smile" style={{ color: '#f7b928' }} />
              Feeling
            </button>
            <button className="create-post__shortcut" onClick={openForm}>
              <i className="bi bi-geo-alt" style={{ color: '#f5533d' }} />
              Location
            </button>
          </div>
        </>
      )}

      {/* Expanded form */}
      {open && (
        <div className="create-post__form">
          <div className="create-post__divider" />

          <textarea
            ref={textRef}
            className="create-post__textarea"
            placeholder={`What's on your mind, ${name}?`}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />

          {preview && (
            <div className="create-post__preview">
              <img src={preview} alt="preview" />
              <button
                className="create-post__preview-remove"
                onClick={() => { setImage(null); setPreview(null) }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          <div className="create-post__footer">
            <div className="create-post__media">
              <button
                className="media-btn"
                onClick={() => fileRef.current?.click()}
                title="Add photo"
              >
                <i className="bi bi-image" style={{ color: '#45bd62' }} />
              </button>
              <button className="media-btn" title="Feeling / Activity">
                <i className="bi bi-emoji-smile" style={{ color: '#f7b928' }} />
              </button>
              <button className="media-btn" title="Tag location">
                <i className="bi bi-geo-alt" style={{ color: '#f5533d' }} />
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              style={{ display: 'none' }}
              onChange={handleImage}
            />

            <div className="create-post__btns">
              <button className="btn btn--gray btn--sm" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn btn--primary btn--sm"
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && !image)}
              >
                {loading ? (
                  <><i className="bi bi-arrow-repeat" style={{ animation: 'spin .6s linear infinite' }} /> Posting…</>
                ) : (
                  <><i className="bi bi-send" /> Post</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}