import React, { useState } from 'react'
import TenantBills from './TenantBills'
import TenantComplaints from './TenantComplaints'
import TenantProfile from './TenantProfile'
import TenantAnnouncements from './TenantAnnouncements'
import TenantEmergency from './TenantEmergency'
import { User, CreditCard, FileText, Bell, Phone, LogOut, Menu, X } from 'lucide-react'

const MENU = [
  { id: 'profile', icon: <User size={20} />, label: 'My Profile' },
  { id: 'bills', icon: <CreditCard size={20} />, label: 'My Bills' },
  { id: 'complaints', icon: <FileText size={20} />, label: 'Complaints' },
  { id: 'announcements', icon: <Bell size={20} />, label: 'Announcements' },
  { id: 'emergency', icon: <Phone size={20} />, label: 'Emergency' },
]

export default function TenantDashboard({ user, onLogout, showToast }) {
  const [tab, setTab] = useState('profile')
  const [menuOpen, setMenuOpen] = useState(false)

  const PAGES = {
    profile: <TenantProfile showToast={showToast} />,
    bills: <TenantBills showToast={showToast} />,
    complaints: <TenantComplaints showToast={showToast} />,
    announcements: <TenantAnnouncements showToast={showToast} />,
    emergency: <TenantEmergency />,
  }

  return (
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🏠 RentEase</h1>
          <p>Tenant Portal</p>
        </div>
        <nav className="sidebar-nav">
          {MENU.map(m => (
            <div key={m.id} className={`nav-item ${tab === m.id ? 'active' : ''}`}
              onClick={() => { setTab(m.id); setMenuOpen(false) }}>
              <span className="nav-icon">{m.icon}</span>{m.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 13, opacity: .8, marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{user.username}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Tenant Portal</div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        {PAGES[tab]}
      </div>
    </div>
  )
}
