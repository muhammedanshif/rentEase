import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Complaints({ showToast }) {
  const [complaints, setComplaints] = useState([])
  const [replyModal, setReplyModal] = useState(null)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('in_progress')
  const [filter, setFilter] = useState('all')

  const load = () => API.get('/complaints').then(r => setComplaints(r.data))
  useEffect(() => { load() }, [])

  const sendReply = async () => {
    try { await API.put(`/complaints/${replyModal.id}/reply`, {reply, status}); showToast('Reply sent','success'); setReplyModal(null); load() }
    catch(ex) { showToast('Error','error') }
  }

  const closeComplaint = async id => {
    if (!confirm('Mark this complaint as closed?')) return
    try { await API.put(`/complaints/${id}/close`); showToast('Complaint closed','success'); load() }
    catch(ex) { showToast('Error','error') }
  }

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter)
  const statusColor = s => ({open:'danger',in_progress:'warning',resolved:'success',closed:'gray'}[s]||'gray')

  return (
    <div>
      <div className="page-header">
        <div><h2>📋 Complaints</h2><p>Manage tenant issues</p></div>
      </div>
      <div className="page-body">
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['all','open','in_progress','resolved','closed'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f==='all'?'All':f.replace('_',' ')}
            </button>
          ))}
        </div>
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Tenant</th><th>Subject</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><b>{c.tenant_name}</b></td>
                    <td>{c.subject}</td>
                    <td><span className="badge badge-info">{c.category}</span></td>
                    <td><span className={`badge badge-${statusColor(c.status)}`}>{c.status.replace('_',' ')}</span></td>
                    <td style={{fontSize:12}}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{whiteSpace:'nowrap'}}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setReplyModal(c); setReply(c.admin_reply||''); setStatus(c.status) }}>💬 Reply</button>
                      {c.status !== 'closed' && <button className="btn btn-ghost btn-sm" style={{marginLeft:4}} onClick={() => closeComplaint(c.id)}>✅ Close</button>}
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={6} className="text-center text-muted" style={{padding:40}}>No complaints found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {replyModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setReplyModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>💬 Reply to Complaint</h3><button className="modal-close" onClick={() => setReplyModal(null)}>×</button></div>
            <div className="modal-body">
              <div style={{background:'var(--gray-100)',padding:14,borderRadius:8,marginBottom:16}}>
                <div style={{fontWeight:700,marginBottom:4}}>{replyModal.subject}</div>
                <div style={{fontSize:13,color:'var(--gray-600)'}}>{replyModal.description}</div>
              </div>
              <div className="form-group"><label>Status</label>
                <select className="form-control" value={status} onChange={e=>setStatus(e.target.value)}>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="form-group"><label>Your Reply</label>
                <textarea className="form-control" rows={4} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setReplyModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendReply}>📤 Send Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
