import React, { useState, useEffect } from 'react'
import API, { UPLOADS } from '../../api'

export default function PaymentConfig({ showToast }) {
  const [settings, setSettings] = useState({upi_id:'',upi_qr_code:null})
  const [loading, setLoading] = useState(false)

  const load = () => API.get('/payment-settings').then(r => setSettings(r.data))
  useEffect(() => { load() }, [])

  const saveUPI = async e => {
    e.preventDefault()
    try { await API.post('/payment-settings', {upi_id: settings.upi_id}); showToast('UPI ID saved','success') }
    catch(ex) { showToast('Error saving UPI ID','error') }
  }

  const uploadQR = async e => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('qr_code', file)
    setLoading(true)
    try { await API.post('/payment-settings/qr-code', fd); showToast('QR code uploaded','success'); load() }
    catch(ex) { showToast('Upload failed','error') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header"><div><h2>⚙️ Payment Settings</h2><p>Configure UPI payment for tenants</p></div></div>
      <div className="page-body">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div className="card">
            <div className="card-header"><h3>🔗 UPI ID</h3></div>
            <div className="card-body">
              <p style={{fontSize:13,color:'var(--gray-500)',marginBottom:16}}>Enter your UPI ID so tenants can pay directly.</p>
              <form onSubmit={saveUPI}>
                <div className="form-group">
                  <label>UPI ID</label>
                  <input className="form-control" placeholder="yourname@upi" value={settings.upi_id||''} onChange={e=>setSettings({...settings,upi_id:e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary">💾 Save UPI ID</button>
              </form>
              {settings.upi_id && (
                <div style={{marginTop:16,padding:12,background:'var(--primary-light)',borderRadius:8}}>
                  <div style={{fontSize:12,color:'var(--gray-500)'}}>Current UPI ID:</div>
                  <div style={{fontWeight:700,color:'var(--primary)',fontSize:16}}>{settings.upi_id}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>📱 UPI QR Code</h3></div>
            <div className="card-body">
              <p style={{fontSize:13,color:'var(--gray-500)',marginBottom:16}}>Upload your UPI QR code image.</p>
              <div className="upload-area" onClick={() => document.getElementById('qrInput').click()}>
                <div style={{fontSize:32}}>📱</div>
                <p>{loading ? 'Uploading...' : 'Click to upload QR code image'}</p>
                <input type="file" id="qrInput" accept="image/*" hidden onChange={uploadQR} disabled={loading} />
              </div>
              {settings.upi_qr_code && (
                <div style={{marginTop:16,textAlign:'center'}}>
                  <div style={{fontSize:12,color:'var(--gray-500)',marginBottom:8}}>Current QR Code:</div>
                  <img src={`${UPLOADS}/${settings.upi_qr_code}`} alt="UPI QR" style={{maxWidth:180,borderRadius:10,border:'2px solid var(--primary-light)'}} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{marginTop:20}}>
          <div className="card-header"><h3>ℹ️ How Tenant Payment Works</h3></div>
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,textAlign:'center'}}>
              {[['1️⃣','Admin creates bill','Bill appears in tenant dashboard'],['2️⃣','Tenant views UPI details','QR code and UPI ID shown'],['3️⃣','Tenant pays & uploads screenshot','Proof of payment submitted'],['4️⃣','Admin verifies & receipt generated','Payment confirmed']].map(([n,t,d]) => (
                <div key={n} style={{padding:16,background:'var(--gray-100)',borderRadius:10}}>
                  <div style={{fontSize:28,marginBottom:8}}>{n}</div>
                  <div style={{fontWeight:700,fontSize:13}}>{t}</div>
                  <div style={{fontSize:12,color:'var(--gray-500)',marginTop:4}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
