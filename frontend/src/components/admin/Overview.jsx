import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Overview({ showToast }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    API.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => showToast('Failed to load stats','error'))
  }, [])

  if (!stats) return <div className="loading-screen">Loading...</div>

  const cards = [
    { icon:'🏢', label:'Buildings', value:stats.total_buildings, color:'blue' },
    { icon:'🚪', label:'Total Rooms', value:stats.total_rooms, color:'purple' },
    { icon:'✅', label:'Occupied', value:stats.occupied_rooms, color:'green' },
    { icon:'🔓', label:'Vacant', value:stats.vacant_rooms, color:'yellow' },
    { icon:'👥', label:'Tenants', value:stats.total_tenants, color:'cyan' },
    { icon:'💰', label:'Revenue (Month)', value:`₹${stats.monthly_revenue?.toLocaleString()}`, color:'green' },
    { icon:'📄', label:'Pending Bills', value:stats.pending_bills, color:'warning' },
    { icon:'📋', label:'Open Issues', value:stats.open_complaints, color:'red' },
  ]

  return (
    <div>
      <div className="page-header">
        <div><h2>Dashboard Overview</h2><p>Welcome back! Here's what's happening today.</p></div>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {cards.map((c,i) => (
            <div key={i} className="stat-card">
              <div className={`stat-icon ${c.color}`}>{c.icon}</div>
              <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
            </div>
          ))}
        </div>
        {stats.expected_revenue > 0 && (
          <div className="card mt-4">
            <div className="card-header"><h3>📈 Collection Rate This Month</h3></div>
            <div className="card-body">
              <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                <div><div className="stat-label">Collected</div><div style={{fontSize:22,fontWeight:800,color:'var(--success)'}}>₹{stats.monthly_revenue?.toLocaleString()}</div></div>
                <div><div className="stat-label">Expected</div><div style={{fontSize:22,fontWeight:800}}>₹{stats.expected_revenue?.toLocaleString()}</div></div>
                <div><div className="stat-label">Collection Rate</div><div style={{fontSize:22,fontWeight:800,color:'var(--primary)'}}>{stats.collection_rate}%</div></div>
              </div>
              <div style={{marginTop:12,height:10,background:'var(--gray-100)',borderRadius:99}}>
                <div style={{height:10,background:'var(--success)',borderRadius:99,width:`${Math.min(stats.collection_rate,100)}%`,transition:'width .5s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
