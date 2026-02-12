import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Buildings({ showToast }) {
  const [buildings, setBuildings] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({name:'',address:'',total_floors:'',building_type:'residential'})

  const load = () => API.get('/buildings').then(r => setBuildings(r.data))
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    try {
      if (editing) { await API.put(`/buildings/${editing.id}`, form); showToast('Building updated','success') }
      else { await API.post('/buildings', form); showToast('Building added','success') }
      load(); setModal(false); setEditing(null); setForm({name:'',address:'',total_floors:'',building_type:'residential'})
    } catch(ex) { showToast(ex.response?.data?.message||'Error','error') }
  }

  const del = async id => {
    if (!window.confirm('Delete this building? All rooms will be deleted!')) return
    try { await API.delete(`/buildings/${id}`); showToast('Deleted','success'); load() }
    catch(ex) { showToast(ex.response?.data?.message||'Error','error') }
  }

  const edit = b => { setEditing(b); setForm({name:b.name,address:b.address,total_floors:b.total_floors||'',building_type:b.building_type}); setModal(true) }

  return (
    <div>
      <div className="page-header">
        <div><h2>🏢 Buildings</h2><p>Manage your properties</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({name:'',address:'',total_floors:'',building_type:'residential'}); setModal(true) }}>+ Add Building</button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Address</th><th>Type</th><th>Floors</th><th>Rooms</th><th>Occupied</th><th>Actions</th></tr></thead>
              <tbody>
                {buildings.map(b => (
                  <tr key={b.id}>
                    <td><b>{b.name}</b></td>
                    <td>{b.address}</td>
                    <td><span className="badge badge-primary">{b.building_type}</span></td>
                    <td>{b.total_floors||'-'}</td>
                    <td>{b.room_count}</td>
                    <td>{b.occupied}/{b.room_count}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => edit(b)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" style={{marginLeft:6}} onClick={() => del(b.id)}>🗑 Del</button>
                    </td>
                  </tr>
                ))}
                {!buildings.length && <tr><td colSpan={7} className="text-center text-muted" style={{padding:40}}>No buildings yet. Add your first building!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing?'Edit Building':'Add Building'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label>Building Name *</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                <div className="form-group"><label>Address *</label><textarea className="form-control" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required /></div>
                <div className="form-row">
                  <div className="form-group"><label>Type</label>
                    <select className="form-control" value={form.building_type} onChange={e=>setForm({...form,building_type:e.target.value})}>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Total Floors</label><input type="number" className="form-control" value={form.total_floors} onChange={e=>setForm({...form,total_floors:e.target.value})} /></div>
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
