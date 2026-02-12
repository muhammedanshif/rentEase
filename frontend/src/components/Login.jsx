import React, { useState } from 'react'
import API from '../api'
export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const res = await API.post('/auth/login', form)
      onLogin(res.data.token, res.data.user)
    } catch (ex) { setErr(ex.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <h1>🏠 RentEase</h1>
          <p>Property Management System</p>
        </div>
        {err && <div className="alert alert-error">⚠ {err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username</label>
            <input className="form-control" placeholder="Enter username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" placeholder="Enter password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? '⏳ Logging in...' : ' Login'}
          </button>
        </form>
        <p className="text-muted text-center mt-3" style={{ fontSize: '12px' }}>
          <b>All In One Place</b>
        </p>
      </div>
    </div>
  )
}
