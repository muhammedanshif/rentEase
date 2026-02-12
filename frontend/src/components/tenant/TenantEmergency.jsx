import React, { useState, useEffect } from 'react'
import API from '../../api'

export default function TenantEmergency() {
  const [contacts, setContacts] = useState([])
  useEffect(() => { API.get('/emergency-contacts').then(r => setContacts(r.data)) }, [])
  return (
    <div>
      <div className="page-header"><div><h2>🚨 Emergency Contacts</h2><p>Important numbers to keep handy</p></div></div>
      <div className="page-body">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
          {contacts.map(c => (
            <div key={c.id} className="card">
              <div className="card-body" style={{textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:8}}>
                  {{'Police':'👮','Fire':'🚒','Ambulance':'🚑','Electrician':'⚡','Plumber':'🔧'}[c.service_type]||'📞'}
                </div>
                <h3 style={{fontSize:17,fontWeight:700}}>{c.service_type}</h3>
                {c.contact_name && <p style={{color:'var(--gray-500)',fontSize:13}}>{c.contact_name}</p>}
                <a href={`tel:${c.phone_number}`} className="btn btn-primary" style={{marginTop:12,justifyContent:'center',width:'100%'}}>
                  📞 {c.phone_number}
                </a>
                {c.alternate_phone && <a href={`tel:${c.alternate_phone}`} className="btn btn-ghost btn-sm" style={{marginTop:8,justifyContent:'center',width:'100%'}}>Alt: {c.alternate_phone}</a>}
                {c.available_24x7 && <div style={{marginTop:8}}><span className="badge badge-success">✓ 24x7 Available</span></div>}
              </div>
            </div>
          ))}
          {!contacts.length && <div className="empty-state"><div className="empty-icon">🚨</div><h3>No contacts yet</h3></div>}
        </div>
      </div>
    </div>
  )
}
