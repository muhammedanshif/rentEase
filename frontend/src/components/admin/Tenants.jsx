import React, { useState, useEffect } from 'react'
import API, { UPLOADS } from '../../api'
import { Trash2, Eye, FileText, UserPlus, Upload, Shield, Phone, Mail, Home, CreditCard, Calendar } from 'lucide-react'
import ConfirmModal from '../ConfirmModal'

export default function Tenants({ showToast }) {
  const [tenants, setTenants] = useState([])
  const [rooms, setRooms] = useState([])
  const [modal, setModal] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', phone: '', room_id: '', id_proof_type: 'Aadhar', id_proof_number: '', lease_start_date: '', lease_end_date: '', deposit_amount: '', emergency_contact_name: '', emergency_contact_phone: '' })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  const load = () => {
    API.get('/tenants').then(r => setTenants(r.data))
    API.get('/rooms').then(r => setRooms(r.data.filter(r => r.status === 'vacant')))
  }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    try {
      await API.post('/tenants', form)
      showToast('Tenant created! They can now login.', 'success'); load(); setModal(false)
      setForm({ username: '', password: '', full_name: '', email: '', phone: '', room_id: '', id_proof_type: 'Aadhar', id_proof_number: '', lease_start_date: '', lease_end_date: '', deposit_amount: '', emergency_contact_name: '', emergency_contact_phone: '' })
    } catch (ex) { showToast(ex.response?.data?.message || 'Error', 'error') }
  }

  const del = t => {
    setConfirmMessage(`Delete tenant "${t.full_name}"? This will delete all their bills and complaints.`)
    setConfirmAction(() => async () => {
      try { await API.delete(`/tenants/${t.id}`); showToast('Tenant deleted', 'success'); load() }
      catch (ex) { showToast(ex.response?.data?.message || 'Error', 'error') }
    })
    setConfirmOpen(true)
  }

  const uploadPhoto = async (tid, file) => {
    const fd = new FormData(); fd.append('photo', file)
    try { await API.post(`/tenants/${tid}/photo`, fd); showToast('Photo uploaded', 'success'); setUploadModal(null); load() }
    catch (ex) { showToast('Upload failed', 'error') }
  }

  const uploadDocs = async (tid, files) => {
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('documents', f))
    try { await API.post(`/tenants/${tid}/documents`, fd); showToast('Documents uploaded', 'success'); load() }
    catch (ex) { showToast('Upload failed', 'error') }
  }

  return (
    <div>
      <div className="page-header">
        <div><h2><UserPlus size={24} style={{ marginRight: 10 }} /> Tenants</h2><p>Manage your tenants</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><UserPlus size={16} /> Add Tenant</button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Room</th><th>Building</th><th>Rent</th><th>Deposit</th><th>Lease End</th><th>Actions</th></tr></thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id}>
                    <td data-label="Name"><b>{t.full_name}</b><div style={{ fontSize: 12, color: 'var(--gray-500)' }}>@{t.username}</div></td>
                    <td data-label="Room">{t.room_number || <span className="badge badge-warning">No Room</span>}</td>
                    <td data-label="Building">{t.building_name || '-'}</td>
                    <td data-label="Rent">{t.rent_amount ? `₹${t.rent_amount?.toLocaleString()}` : '-'}</td>
                    <td data-label="Deposit">{t.deposit_amount ? `₹${t.deposit_amount?.toLocaleString()}` : '-'}</td>
                    <td data-label="Lease End">{t.lease_end_date || '-'}</td>
                    <td data-label="Actions" style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(t)}><Eye size={14} /> View</button>
                      <button className="btn btn-primary btn-sm" style={{ marginLeft: 4 }} onClick={() => setUploadModal(t)}><FileText size={14} /> Docs</button>
                      <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => del(t)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {!tenants.length && <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No tenants yet. Add your first tenant!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header"><h3>➕ Add New Tenant</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="section-title">🔐 Login Credentials</div>
                <div className="form-row">
                  <div className="form-group"><label>Username *</label><input className="form-control" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
                  <div className="form-group"><label>Password *</label><input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
                </div>
                <div className="section-title">👤 Personal Info</div>
                <div className="form-row">
                  <div className="form-group"><label>Full Name *</label><input className="form-control" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label>Room</label>
                    <select className="form-control" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
                      <option value="">No room yet</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.building_name} - {r.room_number} (₹{r.rent_amount})</option>)}
                    </select>
                  </div>
                </div>
                <div className="section-title">📋 Lease & Deposit</div>
                <div className="form-row">
                  <div className="form-group"><label>Lease Start</label><input type="date" className="form-control" value={form.lease_start_date} onChange={e => setForm({ ...form, lease_start_date: e.target.value })} /></div>
                  <div className="form-group"><label>Lease End</label><input type="date" className="form-control" value={form.lease_end_date} onChange={e => setForm({ ...form, lease_end_date: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Deposit Amount (₹)</label><input type="number" className="form-control" value={form.deposit_amount} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} /></div>
                <div className="section-title">🪪 ID Proof</div>
                <div className="form-row">
                  <div className="form-group"><label>ID Type</label>
                    <select className="form-control" value={form.id_proof_type} onChange={e => setForm({ ...form, id_proof_type: e.target.value })}>
                      <option>Aadhar</option><option>PAN</option><option>Passport</option><option>Voter ID</option><option>Driving License</option>
                    </select>
                  </div>
                  <div className="form-group"><label>ID Number</label><input className="form-control" value={form.id_proof_number} onChange={e => setForm({ ...form, id_proof_number: e.target.value })} /></div>
                </div>
                <div className="section-title">🆘 Emergency Contact</div>
                <div className="form-row">
                  <div className="form-group"><label>Name</label><input className="form-control" value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
                  <div className="form-group"><label>Phone</label><input className="form-control" value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Tenant Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header"><h3>👁 {viewModal.full_name}</h3><button className="modal-close" onClick={() => setViewModal(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
                {viewModal.photo_path ? <img src={`${UPLOADS}/${viewModal.photo_path}`} className="profile-pic" style={{ width: 100, height: 100 }} /> : <div style={{ width: 100, height: 100, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>}
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{viewModal.full_name}</h3>
                  <p style={{ color: 'var(--gray-500)' }}>@{viewModal.username}</p>
                  <div style={{ marginTop: 8 }}><span className="badge badge-success">Active Tenant</span></div>
                </div>
              </div>
              <div className="info-grid">
                {[['📞 Phone', viewModal.phone], ['📧 Email', viewModal.email], ['🏢 Building', viewModal.building_name], ['🚪 Room', viewModal.room_number], ['💰 Rent', viewModal.rent_amount ? `₹${viewModal.rent_amount}` : '-'], ['💵 Deposit', viewModal.deposit_amount ? `₹${viewModal.deposit_amount}` : '-'], ['📅 Lease Start', viewModal.lease_start_date], ['📅 Lease End', viewModal.lease_end_date], ['🪪 ID Type', viewModal.id_proof_type], ['🔢 ID Number', viewModal.id_proof_number], ['🆘 Emg. Contact', viewModal.emergency_contact_name], ['📱 Emg. Phone', viewModal.emergency_contact_phone]].map(([l, v]) => (
                  <div key={l} className="info-item"><label>{l}</label><p>{v || '-'}</p></div>
                ))}
              </div>
              {viewModal.documents?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div className="section-title">📎 Documents</div>
                  <div className="doc-grid">
                    {viewModal.documents.map((d, i) => (
                      <div key={i} className="doc-card">
                        <div className="doc-icon">📄</div>
                        <p>{d.split('/').pop()}</p>
                        <a href={`${UPLOADS}/${d}`} target="_blank">View</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Docs Modal */}
      {uploadModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUploadModal(null)}>
          <div className="modal modal-sm">
            <div className="modal-header"><h3>📎 Upload for {uploadModal.full_name}</h3><button className="modal-close" onClick={() => setUploadModal(null)}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label>📷 Tenant Photo</label>
                <div className="upload-area" onClick={() => document.getElementById('photoInput').click()}>
                  <div style={{ fontSize: 32 }}>📷</div>
                  <p>Click to upload photo</p>
                  <input type="file" id="photoInput" accept="image/*" hidden onChange={e => uploadPhoto(uploadModal.id, e.target.files[0])} />
                </div>
              </div>
              <div className="form-group">
                <label>📄 Documents (Aadhar, PAN, etc.)</label>
                <div className="upload-area" onClick={() => document.getElementById('docsInput').click()}>
                  <div style={{ fontSize: 32 }}>📎</div>
                  <p>Click to upload documents (multiple files allowed)</p>
                  <input type="file" id="docsInput" multiple hidden onChange={e => uploadDocs(uploadModal.id, e.target.files)} />
                </div>
              </div>
              {uploadModal.documents?.length > 0 && (
                <div>
                  <div className="section-title">Existing Documents</div>
                  {uploadModal.documents.map((d, i) => <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>📄 {d.split('/').pop()}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title="Delete Tenant?"
        message={confirmMessage}
      />
    </div>
  )
}
