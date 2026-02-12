import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Emergency({ showToast }) {
  const [contacts, setContacts] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({service_type:'',contact_name:'',phone_number:'',alternate_phone:'',available_24x7:true})

  const load = () => API.get('/emergency-contacts').then(r => setContacts(r.data))
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    try {
      if (editing) { await API.put(`/emergency-contacts/${editing.id}`, form); showToast('Updated','success') }
      else { await API.post('/emergency-contacts', form); showToast('Contact added','success') }
      load(); setModal(false); setEditing(null); setForm({service_type:'',contact_name:'',phone_number:'',alternate_phone:'',available_24x7:true})
    } catch(ex) { showToast('Error','error') }
  }

  const del = async id => {
    if (!confirm('Delete this contact?')) return
    try { await API.delete(`/emergency-contacts/${id}`); showToast('Deleted','success'); load() }
    catch(ex) { showToast('Error','error') }
  }

  const edit = c => { setEditing(c); setForm({service_type:c.service_type,contact_name:c.contact_name||'',phone_number:c.phone_number,alternate_phone:c.alternate_phone||'',available_24x7:c.available_24x7}); setModal(true) }

  return (
    <div>
      <div className="page-header">
        <div><h2>🚨 Emergency Contacts</h2><p>Manage emergency services</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({service_type:'',contact_name:'',phone_number:'',alternate_phone:'',available_24x7:true}); setModal(true) }}>+ Add Contact</button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Service</th><th>Name</th><th>Phone</th><th>Alt. Phone</th><th>24x7</th><th>Actions</th></tr></thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id}>
                    <td><b>{c.service_type}</b></td>
                    <td>{c.contact_name||'-'}</td>
                    <td><a href={`tel:${c.phone_number}`} style={{color:'var(--primary)',fontWeight:600}}>{c.phone_number}</a></td>
                    <td>{c.alternate_phone||'-'}</td>
                    <td>{c.available_24x7 ? <span className="badge badge-success">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => edit(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" style={{marginLeft:4}} onClick={() => del(c.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div className="modal modal-sm">
            <div className="modal-header"><h3>{editing?'Edit':'Add'} Emergency Contact</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label>Service Type *</label><input className="form-control" value={form.service_type} onChange={e=>setForm({...form,service_type:e.target.value})} placeholder="Police, Fire, Electrician..." required /></div>
                <div className="form-group"><label>Contact Name</label><input className="form-control" value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} /></div>
                <div className="form-group"><label>Phone *</label><input className="form-control" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} required /></div>
                <div className="form-group"><label>Alternate Phone</label><input className="form-control" value={form.alternate_phone} onChange={e=>setForm({...form,alternate_phone:e.target.value})} /></div>
                <div className="form-group" style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="checkbox" id="avail" checked={form.available_24x7} onChange={e=>setForm({...form,available_24x7:e.target.checked})} />
                  <label htmlFor="avail" style={{margin:0}}>Available 24x7</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
