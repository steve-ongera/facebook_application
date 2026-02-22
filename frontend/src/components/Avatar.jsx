import React from 'react'

const BASE = 'http://localhost:8000'

export default function Avatar({ user, size = 40 }) {
  if (!user) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <div className="avatar-fallback" style={{ fontSize: size * 0.38 }}>?</div>
      </div>
    )
  }

  const initial = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()
  const src = user.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`)
    : null

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e7f0ff' }}>
      {src ? (
        <>
          <img
            src={src}
            alt={user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="avatar-fallback" style={{ display: 'none', fontSize: size * 0.38 }}>
            {initial}
          </div>
        </>
      ) : (
        <div className="avatar-fallback" style={{ fontSize: size * 0.38 }}>{initial}</div>
      )}
    </div>
  )
}