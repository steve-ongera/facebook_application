import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { register as registerApi } from '../services/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: ''
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError("Passwords don't match."); return }
    setError('')
    setLoading(true)
    try {
      const data = await registerApi(form)
      login(data.user, { access: data.access, refresh: data.refresh })
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message)
        const msgs = Object.values(parsed).flat().join(' ')
        setError(msgs)
      } catch {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: 460 }}>
        <h1>facebook</h1>
        <p className="subtitle">Create a new account. It's quick and easy.</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input placeholder="First name" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <input placeholder="Last name" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 10 }}>
            <input placeholder="Username" value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <input type="password" placeholder="New password (min 6 chars)" value={form.password} onChange={set('password')} required />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Confirm password" value={form.password2} onChange={set('password2')} required />
          </div>
          <button className="btn btn--green btn--full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-divider" />
        <div style={{ textAlign: 'center', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: '#1877f2', fontWeight: 600 }}>Log in</Link>
        </div>
      </div>
    </div>
  )
}