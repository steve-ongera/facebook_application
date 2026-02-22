import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { searchUsers } from '../services/api'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [showDrop, setShowDrop]   = useState(false)
  const searchRef = useRef(null)

  /* Debounced search */
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDrop(false); return }
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(query)
        setResults(data)
        setShowDrop(true)
      } catch {}
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const goTo = (path) => {
    setShowDrop(false)
    setQuery('')
    navigate(path)
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo">facebook</Link>

      {/* Search */}
      <div className="navbar__search-wrap" ref={searchRef}>
        <div className="navbar__search">
          <i className="bi bi-search" />
          <input
            placeholder="Search Facebook"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length && setShowDrop(true)}
          />
          {query && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => { setQuery(''); setResults([]); setShowDrop(false) }}
            >
              <i className="bi bi-x-circle-fill" style={{ fontSize: 15 }} />
            </button>
          )}
        </div>

        {showDrop && results.length > 0 && (
          <div className="search-dropdown">
            <div className="search-dropdown__label">People</div>
            {results.map(u => (
              <div
                key={u.id}
                className="search-item"
                onClick={() => goTo(`/profile/${u.id}`)}
              >
                <Avatar user={u} size={40} />
                <div>
                  <div className="search-item__name">{u.first_name ? `${u.first_name} ${u.last_name}` : u.username}</div>
                  <div className="search-item__sub">@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center tabs */}
      <div className="navbar__tabs">
        <button
          className={`nav-tab ${isActive('/') ? 'active' : ''}`}
          onClick={() => goTo('/')}
          title="Home"
        >
          <i className={`bi bi-house${isActive('/') ? '-fill' : ''}`} />
        </button>
        <button
          className={`nav-tab ${isActive('/messages') ? 'active' : ''}`}
          onClick={() => goTo('/messages')}
          title="Messages"
        >
          <i className={`bi bi-chat${isActive('/messages') ? '-fill' : ''}`} />
        </button>
      </div>

      {/* Right actions */}
      <div className="navbar__right">
        <button className="navbar__icon-btn" title="Notifications">
          <i className="bi bi-bell-fill" style={{ fontSize: 17 }} />
        </button>

        <div
          className="navbar__avatar-btn"
          onClick={() => goTo(`/profile/${user?.id}`)}
          title="Profile"
        >
          <Avatar user={user} size={40} />
        </div>

        <button className="btn btn--gray btn--sm" onClick={logout}>
          <i className="bi bi-box-arrow-right" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}