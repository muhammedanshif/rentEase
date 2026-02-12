import React, { useState, useEffect } from 'react'
import API from '../../api'
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react'

export default function TenantAnnouncements() {
  const [list, setList] = useState([])
  useEffect(() => { API.get('/announcements').then(r => setList(r.data)) }, [])

  const prColor = p => ({ urgent: 'danger', high: 'warning', normal: 'primary', low: 'gray' }[p])
  const prIcon = p => {
    switch (p) {
      case 'urgent': return <AlertCircle size={20} color="var(--danger)" />
      case 'high': return <AlertCircle size={20} color="var(--warning)" />
      case 'normal': return <Info size={20} color="var(--primary)" />
      default: return <CheckCircle size={20} color="var(--gray-500)" />
    }
  }
  return (
    <div>
      <div className="page-header"><div><h2><Bell size={24} style={{ marginRight: 10 }} /> Announcements</h2><p>Updates from management</p></div></div>
      <div className="page-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(a => (
            <div key={a.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  {prIcon(a.priority)}
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</h3>
                  <span className={`badge badge-${prColor(a.priority)}`}>{a.priority}</span>
                </div>
                <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6 }}>{a.message}</p>
                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!list.length && <div className="empty-state"><div className="empty-icon"><Bell size={48} /></div><h3>No announcements</h3></div>}
        </div>
      </div>
    </div>
  )
}
