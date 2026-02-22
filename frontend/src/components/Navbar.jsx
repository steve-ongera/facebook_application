import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { searchUsers } from '../services/api'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(query)
        setResults(data)
        setShowResults(true)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo">facebook</Link>

      {/* Search */}
      <div style={{ position: 'relative' }} ref={searchRef}>
        <div className="navbar__search">
          <span>🔍</span>
          <input
            placeholder="Search Facebook"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length && setShowResults(true)}
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="search-results">
            {results.map(u => (
              <div
                key={u.id}
                className="search-result-item"
                onClick={() => { navigate(`/profile/${u.id}`); setShowResults(false); setQuery('') }}
              >
                <div className="search-result-item__avatar">
                  <Avatar user={u} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav Icons */}
      <div className="navbar__center">
        <button
          className={`navbar__icon-btn ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title="Home"
        >🏠</button>
        <button
          className={`navbar__icon-btn ${location.pathname.startsWith('/messages') ? 'active' : ''}`}
          onClick={() => navigate('/messages')}
          title="Messages"
        >💬</button>
      </div>

      {/* User */}
      <div className="navbar__right">
        <div className="navbar__avatar" onClick={() => navigate(`/profile/${user?.id}`)}>
          <Avatar user={user} />
        </div>
        <button className="btn btn--gray btn--sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  )
}