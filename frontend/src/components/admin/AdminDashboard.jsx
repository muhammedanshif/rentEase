import React, { useState } from 'react'
import Overview from './Overview'
import Buildings from './Buildings'
import Rooms from './Rooms'
import Tenants from './Tenants'
import Bills from './Bills'
import Complaints from './Complaints'
import Announcements from './Announcements'
import Emergency from './Emergency'
import PaymentConfig from './PaymentConfig'

const MENU = [
  { id:'overview', icon:'📊', label:'Overview' },
  { id:'buildings', icon:'🏢', label:'Buildings' },
  { id:'rooms', icon:'🚪', label:'Rooms' },
  { id:'tenants', icon:'👥', label:'Tenants' },
  { id:'bills', icon:'💳', label:'Bills' },
  { id:'complaints', icon:'📋', label:'Complaints' },
  { id:'announcements', icon:'📢', label:'Announcements' },
  { id:'emergency', icon:'🚨', label:'Emergency' },
  { id:'payment-config', icon:'⚙️', label:'Payment Settings' },
]

export default function AdminDashboard({ user, onLogout, showToast }) {
  const [tab, setTab] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  const PAGES = { overview:<Overview showToast={showToast}/>, buildings:<Buildings showToast={showToast}/>, rooms:<Rooms showToast={showToast}/>, tenants:<Tenants showToast={showToast}/>, bills:<Bills showToast={showToast}/>, complaints:<Complaints showToast={showToast}/>, announcements:<Announcements showToast={showToast}/>, emergency:<Emergency showToast={showToast}/>, 'payment-config':<PaymentConfig showToast={showToast}/> }

  return (
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:99}} />}
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🏠 RentEase</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          {MENU.map(m => (
            <div key={m.id} className={`nav-item ${tab===m.id?'active':''}`}
              onClick={() => { setTab(m.id); setMenuOpen(false) }}>
              <span className="nav-icon">{m.icon}</span>{m.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{fontSize:13,opacity:.8,marginBottom:10}}>
            <b>{user.username}</b><br/>Administrator
          </div>
          <button className="btn btn-ghost" style={{width:'100%',justifyContent:'center'}} onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        {PAGES[tab]}
      </div>
    </div>
  )
}
