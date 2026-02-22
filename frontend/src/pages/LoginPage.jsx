import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { login as loginApi } from '../services/api'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginApi(form.username, form.password)
      login(data.user, { access: data.access, refresh: data.refresh })
    } catch (err) {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 800, alignItems: 'center' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#1877f2', letterSpacing: -2 }}>facebook</div>
          <p style={{ fontSize: 18, color: '#1c1e21', maxWidth: 340 }}>
            Connect with friends and the world around you.
          </p>
        </div>

        {/* Form */}
        <div className="auth-box">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                placeholder="Username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
          <div className="auth-divider" />
          <div style={{ textAlign: 'center' }}>
            <Link to="/register">
              <button className="btn btn--green" style={{ padding: '10px 20px' }}>
                Create new account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}