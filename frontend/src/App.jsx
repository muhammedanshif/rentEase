import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import AdminDashboard from './components/admin/AdminDashboard'
import TenantDashboard from './components/tenant/TenantDashboard'
import ToastContainer from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) setUser(JSON.parse(u))
    setLoading(false)
  }, [])

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    showToast(`Welcome back, ${userData.username}!`, 'success')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    showToast('Logged out successfully', 'info')
  }

  if (loading) return <div className="loading-screen">⏳ Loading...</div>

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/*" element={
            !user ? <Navigate to="/login" /> :
            user.role === 'admin'
              ? <AdminDashboard user={user} onLogout={handleLogout} showToast={showToast} />
              : <TenantDashboard user={user} onLogout={handleLogout} showToast={showToast} />
          } />
        </Routes>
      </BrowserRouter>
    </>
  )
}
