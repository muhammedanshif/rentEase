import React, { useState, useEffect } from 'react'
import API from '../../api'
import { ClipboardList, Plus, X, Send, MessageSquare, AlertCircle } from 'lucide-react'

export default function TenantComplaints({ showToast }) {
  const [complaints, setComplaints] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'maintenance' })

  const load = () => API.get('/complaints').then(r => setComplaints(r.data))
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    try { await API.post('/complaints', form); showToast('Complaint submitted', 'success'); load(); setModal(false); setForm({ subject: '', description: '', category: 'maintenance' }) }
    catch (ex) { showToast('Error', 'error') }
  }

  const statusColor = s => ({ open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'gray' }[s] || 'gray')

  return (
    <div>
      <div className="page-header">
        <div><h2><ClipboardList size={24} style={{ marginRight: 10 }} /> My Complaints</h2><p>Report and track issues</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> New Complaint</button>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map(c => (
            <div key={c.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>{c.subject}</h3>
                      <span className={`badge badge-${statusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                      <span className="badge badge-info">{c.category}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>{c.description}</p>
                    {c.admin_reply && (
                      <div style={{ marginTop: 12, padding: 12, background: 'var(--primary-light)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={14} /> Admin Reply:
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-700)' }}>{c.admin_reply}</p>
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!complaints.length && <div className="empty-state"><div className="empty-icon"><ClipboardList size={48} /></div><h3>No complaints yet</h3><p>Everything working well? Great!</p></div>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3><AlertCircle size={20} style={{ marginRight: 8 }} /> Submit Complaint</h3><button className="modal-close" onClick={() => setModal(false)}><X size={20} /></button></div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-group"><label>Subject *</label><input className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="maintenance">Maintenance</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label>Description *</label><textarea className="form-control" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Send size={16} /> Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
