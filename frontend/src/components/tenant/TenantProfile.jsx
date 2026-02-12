import React, { useState, useEffect } from 'react'
import API, { UPLOADS } from '../../api'
import { User, Phone, Mail, Home, Key, CreditCard, Calendar, FileText, Shield, AlertCircle } from 'lucide-react'

export default function TenantProfile({ showToast }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    API.get('/tenant/my-profile').then(r => setProfile(r.data)).catch(() => showToast('Failed to load profile', 'error'))
  }, [])

  if (!profile) return <div className="loading-screen">Loading...</div>

  return (
    <div>
      <div className="page-header"><div><h2><User size={24} style={{ marginRight: 10 }} /> My Profile</h2><p>Your tenancy details</p></div></div>
      <div className="page-body">
        <div className="profile-grid">
          {/* Left Card */}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              {profile.photo_path
                ? <img src={`${UPLOADS}/${profile.photo_path}`} className="profile-pic" style={{ width: 120, height: 120, margin: '0 auto 16px' }} />
                : <div style={{ width: 120, height: 120, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 16px' }}><User size={48} /></div>}
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{profile.full_name}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Tenant</p>
              <div style={{ margin: '16px 0' }}>
                {profile.room_number && <div style={{ background: 'var(--primary-light)', padding: '10px 16px', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Room</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>{profile.room_number}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{profile.building_name}</div>
                </div>}
                {profile.deposit_amount && <div style={{ background: '#d1fae5', padding: '10px 16px', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Security Deposit</div>
                  <div style={{ fontWeight: 800, color: '#065f46', fontSize: 20 }}>₹{profile.deposit_amount?.toLocaleString()}</div>
                </div>}
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3><FileText size={18} style={{ marginRight: 8 }} /> Tenancy Details</h3></div>
              <div className="card-body">
                <div className="info-grid">
                  {[
                    ['Phone', profile.phone, Phone],
                    ['Email', profile.email, Mail],
                    ['Building', profile.building_name, Home],
                    ['Room', profile.room_number, Key],
                    ['Room Type', profile.room_type, Home],
                    ['Floor', profile.floor_number, Home],
                    ['Monthly Rent', profile.rent_amount ? `₹${profile.rent_amount?.toLocaleString()}` : '-', CreditCard],
                    ['Deposit', profile.deposit_amount ? `₹${profile.deposit_amount?.toLocaleString()}` : '-', Shield],
                    ['Lease Start', profile.lease_start_date || '-', Calendar],
                    ['Lease End', profile.lease_end_date || '-', Calendar],
                    ['ID Type', profile.id_proof_type || '-', FileText],
                    ['Emg. Contact', profile.emergency_contact_name || '-', AlertCircle]
                  ].map(([l, v, Icon]) => (
                    <div key={l} className="info-item">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {l}</label>
                      <p>{v || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {profile.documents?.length > 0 && (
              <div className="card">
                <div className="card-header"><h3><FileText size={18} style={{ marginRight: 8 }} /> My Documents</h3></div>
                <div className="card-body">
                  <div className="doc-grid">
                    {profile.documents.map((d, i) => (
                      <div key={i} className="doc-card">
                        <div className="doc-icon"><FileText size={24} /></div>
                        <p>{d.split('/').pop().substring(37)}</p>
                        <a href={`${UPLOADS}/${d}`} target="_blank">View</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
