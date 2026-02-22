import React from 'react'

const BASE = 'http://localhost:8000'

export default function Avatar({ user, size }) {
  if (!user) return <div className="avatar-fallback">?</div>

  const initials = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()
  const src = user.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`)
    : null

  const style = size ? { width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#e0e0e0', flexShrink: 0 } : {}

  if (src) {
    return (
      <div style={style}>
        <img src={src} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
        />
        <div className="avatar-fallback" style={{ display: 'none' }}>{initials}</div>
      </div>
    )
  }

  return (
    <div style={style}>
      <div className="avatar-fallback">{initials}</div>
    </div>
  )
}