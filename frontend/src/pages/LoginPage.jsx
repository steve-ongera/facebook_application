import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { login as loginApi } from '../services/api'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginApi(form.username, form.password)
      login(data.user, { access: data.access, refresh: data.refresh })
    } catch {
      setError('Incorrect username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="auth-page">
      <div className="auth-grid">

        {/* Branding — hidden on mobile */}
        <div className="auth-brand">
          <div className="auth-brand__logo">facebook</div>
          <p className="auth-brand__tagline">
            Connect with friends and the world around you on Facebook.
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="auth-card__title">Welcome back 👋</h2>
          <p className="auth-card__subtitle">Log in to your Facebook account</p>

          {error && (
            <div className="alert alert--error">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-icon-wrap">
                <i className="bi bi-person" />
                <input
                  className="form-input"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={set('username')}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <i className="bi bi-lock" />
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                    fontSize: 17, display: 'flex', alignItems: 'center'
                  }}
                >
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>

            <button
              className="btn btn--primary btn--full btn--lg"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><i className="bi bi-arrow-repeat" style={{ animation: 'spin .6s linear infinite' }} /> Logging in…</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Log In</>
              )}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/register">
              <button className="btn btn--green btn--full btn--lg">
                <i className="bi bi-person-plus" />
                Create new account
              </button>
            </Link>
          </div>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}