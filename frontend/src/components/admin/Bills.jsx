import React, { useState, useEffect } from 'react'
import API, { UPLOADS } from '../../api'
import { CreditCard, Save, Trash2, CheckCircle, Clock, AlertTriangle, FileText, X } from 'lucide-react'
import ConfirmModal from '../ConfirmModal'

export default function Bills({ showToast }) {
  const [bills, setBills] = useState([])
  const [tenants, setTenants] = useState([])
  const [modal, setModal] = useState(false)
  const [receiptModal, setReceiptModal] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [form, setForm] = useState({ tenant_id: '', bill_type: 'rent', amount: '', billing_month: '', due_date: '', notes: '' })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [previewScreenshot, setPreviewScreenshot] = useState(null)

  const load = () => {
    API.get('/bills').then(r => setBills(r.data))
    API.get('/tenants').then(r => setTenants(r.data))
  }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    try { await API.post('/bills', form); showToast('Bill created', 'success'); load(); setModal(false); setForm({ tenant_id: '', bill_type: 'rent', amount: '', billing_month: '', due_date: '', notes: '' }) }
    catch (ex) { showToast(ex.response?.data?.message || 'Error', 'error') }
  }

  const del = id => {
    setConfirmMessage('Delete this bill?')
    setConfirmAction(() => async () => {
      try { await API.delete(`/bills/${id}`); showToast('Deleted', 'success'); load() }
      catch (ex) { showToast('Error deleting bill', 'error') }
    })
    setConfirmOpen(true)
  }

  const generateRent = async () => {
    try { const r = await API.post('/bills/generate-rent'); showToast(r.data.message, 'success'); load() }
    catch (ex) { showToast('Error generating rent bills', 'error') }
  }

  const viewReceipt = async bill => {
    try { const r = await API.get(`/bills/${bill.id}/receipt`); setReceipt(r.data); setReceiptModal(bill) }
    catch (ex) { showToast('Error loading receipt', 'error') }
  }

  const verifyPayment = bill => {
    setConfirmMessage('Confirm payment verification for this bill?')
    setConfirmAction(() => async () => {
      try { await API.put(`/bills/${bill.id}/pay`); showToast('Payment verified!', 'success'); load(); setPreviewScreenshot(null) }
      catch (ex) { showToast('Verification failed', 'error') }
    })
    setConfirmOpen(true)
  }

  const statusColor = s => s === 'paid' ? 'success' : s === 'overdue' ? 'danger' : s === 'pending_approval' ? 'info' : 'warning'

  return (
    <div>
      <div className="page-header">
        <div><h2><CreditCard size={24} style={{ marginRight: 10 }} /> Bills</h2><p>Manage tenant billing</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-success" onClick={generateRent}>⚡ Generate Rent Bills</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Create Bill</button>
        </div>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Tenant</th><th>Type</th><th>Amount</th><th>Month</th><th>Due Date</th><th>Status</th><th>Screenshot</th><th>Actions</th></tr></thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.id}>
                    <td><b>{b.tenant_name}</b></td>
                    <td><span className="badge badge-primary">{b.bill_type}</span></td>
                    <td><b>₹{b.amount?.toLocaleString()}</b></td>
                    <td>{b.billing_month || '-'}</td>
                    <td>{b.due_date}</td>
                    <td><span className={`badge badge-${statusColor(b.status)}`}>{b.status}</span></td>
                    <td>
                      {b.payment_screenshot
                        ? <button className="btn btn-ghost btn-sm" onClick={() => setPreviewScreenshot(b)}>📷 View</button>
                        : <span className="text-muted">None</span>
                      }
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {b.status === 'paid' && <button className="btn btn-ghost btn-sm" onClick={() => viewReceipt(b)}><FileText size={14} /> Receipt</button>}
                      {b.status === 'pending_approval' && <button className="btn btn-success btn-sm" onClick={() => verifyPayment(b)}><CheckCircle size={14} /> Verify</button>}
                      <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => del(b.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {!bills.length && <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No bills yet. Generate rent bills or create manually.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>💳 Create Bill</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group"><label>Tenant *</label>
                  <select className="form-control" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })} required>
                    <option value="">Select tenant</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name} – {t.room_number}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Bill Type *</label>
                    <select className="form-control" value={form.bill_type} onChange={e => setForm({ ...form, bill_type: e.target.value })}>
                      <option>rent</option><option>electricity</option><option>water</option><option>maintenance</option><option>other</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Amount (₹) *</label><input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Billing Month</label><input type="month" className="form-control" value={form.billing_month} onChange={e => setForm({ ...form, billing_month: e.target.value })} /></div>
                  <div className="form-group"><label>Due Date *</label><input type="date" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required /></div>
                </div>
                <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptModal && receipt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReceiptModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>🖨 Payment Receipt</h3><button className="modal-close" onClick={() => setReceiptModal(null)}>×</button></div>
            <div className="modal-body">
              <div className="receipt-content" id="receipt">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="receipt-logo">🏠 RentEase</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gray-500)' }}>
                    <div><b>Receipt:</b> {receipt.receipt_number}</div>
                    <div><b>Date:</b> {receipt.date}</div>
                  </div>
                </div>
                <hr className="receipt-divider" />
                <div className="receipt-row"><span>Tenant</span><b>{receipt.tenant_name}</b></div>
                <div className="receipt-row"><span>Building</span><b>{receipt.building_name}</b></div>
                <div className="receipt-row"><span>Room</span><b>{receipt.room_number}</b></div>
                <div className="receipt-row"><span>Bill Type</span><b style={{ textTransform: 'capitalize' }}>{receipt.bill_type}</b></div>
                <div className="receipt-row"><span>Billing Month</span><b>{receipt.billing_month || '-'}</b></div>
                <div className="receipt-row"><span>Due Date</span><b>{receipt.due_date}</b></div>
                <div className="receipt-row"><span>Paid Date</span><b style={{ color: 'var(--success)' }}>{receipt.paid_date}</b></div>
                {receipt.notes && <div className="receipt-row"><span>Notes</span><b>{receipt.notes}</b></div>}
                <hr className="receipt-divider" />
                <div className="receipt-total"><span>Amount Paid</span><span>₹{receipt.amount?.toLocaleString()}</span></div>
                <div style={{ marginTop: 16, padding: 10, background: '#d1fae5', borderRadius: 8, textAlign: 'center', color: '#065f46', fontWeight: 700 }}>✅ PAYMENT CONFIRMED</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setReceiptModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print Receipt</button>
            </div>
          </div>
        </div>
      )}
      {previewScreenshot && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPreviewScreenshot(null)}>
          <div className="modal" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
            <button className="modal-close" style={{ position: 'absolute', top: 20, right: 20 }} onClick={() => setPreviewScreenshot(null)}><X /></button>
            <div style={{ background: 'white', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <img src={`${UPLOADS}/${previewScreenshot.payment_screenshot}`} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 4 }} />
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 10 }}>
                {previewScreenshot.status === 'pending_approval' && (
                  <button className="btn btn-success" onClick={() => verifyPayment(previewScreenshot)}>✅ Confirm Payment</button>
                )}
                <button className="btn btn-ghost" onClick={() => setPreviewScreenshot(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title="Are you sure?"
        message={confirmMessage}
      />
    </div>
  )
}
