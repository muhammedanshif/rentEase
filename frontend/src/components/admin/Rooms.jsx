import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function Rooms({ showToast }) {
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [selBuilding, setSelBuilding] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({building_id:'',room_number:'',room_type:'1BHK',floor_number:'',area_sqft:'',rent_amount:'',category:'residential',description:''})

  const load = () => {
    API.get('/buildings').then(r => setBuildings(r.data))
    const url = selBuilding !== 'all' ? `/rooms?building_id=${selBuilding}` : '/rooms'
    API.get(url).then(r => setRooms(r.data))
  }
  useEffect(() => { load() }, [selBuilding])

  const save = async e => {
    e.preventDefault()
    try {
      await API.post('/rooms', form)
      showToast('Room created','success'); load(); setModal(false)
      setForm({building_id:'',room_number:'',room_type:'1BHK',floor_number:'',area_sqft:'',rent_amount:'',category:'residential',description:''})
    } catch(ex) { showToast(ex.response?.data?.message||'Error','error') }
  }

  const del = async id => {
    if (!confirm('Delete this room?')) return
    try { await API.delete(`/rooms/${id}`); showToast('Deleted','success'); load() }
    catch(ex) { showToast(ex.response?.data?.message||'Error','error') }
  }

  // Group by building
  const grouped = buildings.reduce((acc, b) => {
    acc[b.name] = rooms.filter(r => r.building_id === b.id)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div><h2>🚪 Rooms</h2><p>Manage rooms by building</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Room</button>
      </div>
      <div className="page-body">
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
          <button className={`btn ${selBuilding==='all'?'btn-primary':'btn-ghost'}`} onClick={() => setSelBuilding('all')}>All Buildings</button>
          {buildings.map(b => <button key={b.id} className={`btn ${selBuilding==b.id?'btn-primary':'btn-ghost'}`} onClick={() => setSelBuilding(b.id)}>{b.name}</button>)}
        </div>

        {selBuilding === 'all' ? (
          Object.entries(grouped).map(([bname, brooms]) => brooms.length > 0 && (
            <div key={bname} className="card" style={{marginBottom:20}}>
              <div className="card-header"><h3>🏢 {bname} ({brooms.length} rooms)</h3></div>
              <RoomTable rooms={brooms} onDelete={del} />
            </div>
          ))
        ) : (
          <div className="card">
            <RoomTable rooms={rooms} onDelete={del} />
          </div>
        )}

        {rooms.length === 0 && (
          <div className="empty-state"><div className="empty-icon">🚪</div><h3>No rooms yet</h3><p>Add a building first, then add rooms.</p></div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Room</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label>Building *</label>
                  <select className="form-control" value={form.building_id} onChange={e=>setForm({...form,building_id:e.target.value})} required>
                    <option value="">Select building</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Room Number *</label><input className="form-control" value={form.room_number} onChange={e=>setForm({...form,room_number:e.target.value})} required /></div>
                  <div className="form-group"><label>Type *</label>
                    <select className="form-control" value={form.room_type} onChange={e=>setForm({...form,room_type:e.target.value})}>
                      <option>1BHK</option><option>2BHK</option><option>3BHK</option><option>Shop</option><option>Office</option><option>Studio</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Floor</label><input type="number" className="form-control" value={form.floor_number} onChange={e=>setForm({...form,floor_number:e.target.value})} /></div>
                  <div className="form-group"><label>Area (sqft)</label><input type="number" className="form-control" value={form.area_sqft} onChange={e=>setForm({...form,area_sqft:e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Rent Amount (₹) *</label><input type="number" className="form-control" value={form.rent_amount} onChange={e=>setForm({...form,rent_amount:e.target.value})} required /></div>
                  <div className="form-group"><label>Category</label>
                    <select className="form-control" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                      <option value="residential">Residential</option><option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
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

function RoomTable({ rooms, onDelete }) {
  return (
    <div className="table-container">
      <table>
        <thead><tr><th>Room</th><th>Type</th><th>Floor</th><th>Area</th><th>Rent</th><th>Status</th><th>Tenant</th><th>Actions</th></tr></thead>
        <tbody>
          {rooms.map(r => (
            <tr key={r.id}>
              <td><b>{r.room_number}</b></td>
              <td>{r.room_type}</td>
              <td>{r.floor_number ?? '-'}</td>
              <td>{r.area_sqft ? `${r.area_sqft} sqft` : '-'}</td>
              <td>₹{r.rent_amount?.toLocaleString()}</td>
              <td><span className={`badge badge-${r.status==='occupied'?'success':'warning'}`}>{r.status}</span></td>
              <td>{r.tenant_name || '-'}</td>
              <td>
                {r.status !== 'occupied' && <button className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>🗑 Del</button>}
                {r.status === 'occupied' && <span className="text-muted" style={{fontSize:12}}>Has tenant</span>}
              </td>
            </tr>
          ))}
          {!rooms.length && <tr><td colSpan={8} className="text-center text-muted" style={{padding:30}}>No rooms in this building</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
