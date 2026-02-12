import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Announcements({ showToast }) {
  const [list, setList] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({title:'',message:'',priority:'normal'})

  const load = () => API.get('/announcements').then(r => setList(r.data))
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    try {
      if (editing) { await API.put(`/announcements/${editing.id}`, form); showToast('Updated','success') }
      else { await API.post('/announcements', form); showToast('Announcement posted','success') }
      load(); setModal(false); setEditing(null); setForm({title:'',message:'',priority:'normal'})
    } catch(ex) { showToast('Error','error') }
  }

  const del = async id => {
    if (!confirm('Delete this announcement?')) return
    try { await API.delete(`/announcements/${id}`); showToast('Deleted','success'); load() }
    catch(ex) { showToast('Error','error') }
  }

  const edit = a => { setEditing(a); setForm({title:a.title,message:a.message,priority:a.priority}); setModal(true) }
  const prColor = p => ({urgent:'danger',high:'warning',normal:'primary',low:'gray'}[p])

  return (
    <div>
      <div className="page-header">
        <div><h2>📢 Announcements</h2><p>Communicate with tenants</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({title:'',message:'',priority:'normal'}); setModal(true) }}>+ Post Announcement</button>
      </div>
      <div className="page-body">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {list.map(a => (
            <div key={a.id} className="card">
              <div className="card-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <h3 style={{fontSize:16,fontWeight:700}}>{a.title}</h3>
                      <span className={`badge badge-${prColor(a.priority)}`}>{a.priority}</span>
                    </div>
                    <p style={{color:'var(--gray-600)',fontSize:14}}>{a.message}</p>
                    <p style={{fontSize:12,color:'var(--gray-400)',marginTop:8}}>{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <div style={{display:'flex',gap:8,marginLeft:16}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => edit(a)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(a.id)}>🗑 Del</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!list.length && <div className="empty-state"><div className="empty-icon">📢</div><h3>No announcements yet</h3></div>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editing?'Edit Announcement':'Post Announcement'}</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label>Title *</label><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></div>
                <div className="form-group"><label>Message *</label><textarea className="form-control" rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required /></div>
                <div className="form-group"><label>Priority</label>
                  <select className="form-control" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                    <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">📤 {editing?'Update':'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
