import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { register as registerApi } from '../services/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: ''
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError("Passwords don't match."); return }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return }
    setError('')
    setLoading(true)
    try {
      const data = await registerApi(form)
      login(data.user, { access: data.access, refresh: data.refresh })
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message)
        setError(Object.values(parsed).flat().join(' '))
      } catch {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid">

        {/* Branding */}
        <div className="auth-brand">
          <div className="auth-brand__logo">facebook</div>
          <p className="auth-brand__tagline">
            Join millions of people connecting and sharing moments on Facebook.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: 'bi-people-fill',    text: 'Connect with friends & family' },
              { icon: 'bi-image',          text: 'Share photos and life moments' },
              { icon: 'bi-chat-dots-fill', text: 'Message anyone, anywhere' },
            ].map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontSize: 18 }}>
                  <i className={`bi ${f.icon}`} />
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="auth-card__title">Create account 🎉</h2>
          <p className="auth-card__subtitle">It's quick and easy. Free forever.</p>

          {error && (
            <div className="alert alert--error">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>First name</label>
                <div className="input-icon-wrap">
                  <i className="bi bi-person" />
                  <input
                    className="form-input"
                    placeholder="First"
                    value={form.first_name}
                    onChange={set('first_name')}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Last name</label>
                <input
                  className="form-input"
                  placeholder="Last"
                  value={form.last_name}
                  onChange={set('last_name')}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }} />

            <div className="form-group">
              <label>Username</label>
              <div className="input-icon-wrap">
                <i className="bi bi-at" />
                <input
                  className="form-input"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={set('username')}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope" />
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={set('email')}
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
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set('password')}
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

            <div className="form-group">
              <label>Confirm password</label>
              <div className="input-icon-wrap">
                <i className="bi bi-shield-lock" />
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.password2}
                  onChange={set('password2')}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn--green btn--full btn--lg"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><i className="bi bi-arrow-repeat" style={{ animation: 'spin .6s linear infinite' }} /> Creating account…</>
              ) : (
                <><i className="bi bi-person-check" /> Sign Up</>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}