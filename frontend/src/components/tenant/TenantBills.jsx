import React, { useState, useEffect } from 'react'
import API, { UPLOADS } from '../../api'
import { CreditCard, Upload, CheckCircle, Clock, FileText, AlertTriangle, DollarSign } from 'lucide-react'

export default function TenantBills({ showToast }) {
  const [bills, setBills] = useState([])
  const [payModal, setPayModal] = useState(null)
  const [paySettings, setPaySettings] = useState(null)
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receiptModal, setReceiptModal] = useState(null)
  const [receipt, setReceipt] = useState(null)

  const load = () => {
    API.get('/bills').then(r => setBills(r.data))
    API.get('/payment-settings').then(r => setPaySettings(r.data))
  }
  useEffect(() => { load() }, [])

  const uploadScreenshot = async () => {
    if (!screenshotFile) { showToast('Please select a screenshot first', 'warning'); return }
    setUploading(true)
    const fd = new FormData(); fd.append('screenshot', screenshotFile)
    try {
      await API.post(`/bills/${payModal.id}/upload-screenshot`, fd)
      showToast('Screenshot uploaded! Waiting for approval.', 'success')
      load()
      setPayModal(prev => ({ ...prev, payment_screenshot: 'uploaded', status: 'pending_approval' }))
    } catch (ex) { showToast('Upload failed', 'error') }
    finally { setUploading(false) }
  }

  const handleRazorpay = async () => {
    try {
      const order = await API.post('/payment/create-order', { amount: payModal.amount })

      // Handle mock payment for testing
      if (order.data.mock) {
        if (!confirm('Dev Mode: Using Mock Payment (No real money). Proceed?')) return
        await API.post('/payment/verify', {
          bill_id: payModal.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_order_id: order.data.id,
          razorpay_signature: 'mock_signature'
        })
        showToast('Mock Payment successful!', 'success')
        setPayModal(null)
        load()
        return
      }

      const options = {
        key: 'rzp_test_placeholder', // Replace with valid key in production
        amount: order.data.amount,
        currency: order.data.currency,
        name: 'RentEase',
        description: `Payment for ${payModal.bill_type}`,
        order_id: order.data.id,
        handler: async (response) => {
          try {
            await API.post('/payment/verify', {
              bill_id: payModal.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
            showToast('Payment successful!', 'success')
            setPayModal(null)
            load()
          } catch (e) { showToast('Payment verification failed', 'error') }
        },
        prefill: { name: 'RentEase Tenant' },
        theme: { color: '#2563eb' }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      console.error(e)
      showToast(e.response?.data?.message || 'Could not initiate payment', 'error')
    }
  }

  const markPaid = async () => {
    const current = bills.find(b => b.id === payModal.id)
    if (!current?.payment_screenshot) { showToast('Please upload screenshot first', 'warning'); return }
    try {
      await API.put(`/bills/${payModal.id}/mark-paid`)
      showToast('Bill marked as paid! ✅', 'success')
      setPayModal(null); setScreenshotFile(null); load()
    } catch (ex) { showToast(ex.response?.data?.message || 'Error', 'error') }
  }

  const viewReceipt = async bill => {
    try { const r = await API.get(`/bills/${bill.id}/receipt`); setReceipt(r.data); setReceiptModal(true) }
    catch (ex) { showToast('Error loading receipt', 'error') }
  }

  const pending = bills.filter(b => b.status === 'pending')
  const paid = bills.filter(b => b.status === 'paid')
  const total = pending.reduce((s, b) => s + b.amount, 0)

  return (
    <div>
      <div className="page-header"><div><h2>💳 My Bills</h2><p>View and pay your bills</p></div></div>
      <div className="page-body">
        {pending.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fee2e2)', border: '2px solid #fca5a5', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={20} /> You have {pending.length} pending bill(s)</div><div style={{ color: 'var(--gray-600)', fontSize: 14, marginLeft: 28 }}>Total due: ₹{total?.toLocaleString()}</div></div>
            <button className="btn btn-warning" onClick={() => setPayModal(pending[0])}>Pay Now</button>
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3><Clock size={18} style={{ marginRight: 8 }} /> Pending Bills</h3></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Type</th><th>Amount</th><th>Month</th><th>Due Date</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map(b => (
                  <tr key={b.id}>
                    <td data-label="Type"><span className="badge badge-warning">{b.bill_type}</span></td>
                    <td data-label="Amount"><b style={{ fontSize: 16 }}>₹{b.amount?.toLocaleString()}</b></td>
                    <td data-label="Month">{b.billing_month || '-'}</td>
                    <td data-label="Due Date">{b.due_date}</td>
                    <td data-label="Action">
                      {b.status === 'pending_approval'
                        ? <span className="badge badge-info"><Clock size={12} style={{ marginRight: 4 }} /> Verifying</span>
                        : <button className="btn btn-primary btn-sm" onClick={() => { setPayModal(b); setScreenshotFile(null) }}><CreditCard size={14} /> Pay</button>
                      }
                    </td>
                  </tr>
                ))}
                {!pending.length && <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 30 }}>🎉 No pending bills!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3><CheckCircle size={18} style={{ marginRight: 8 }} /> Paid Bills</h3></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Type</th><th>Amount</th><th>Month</th><th>Paid On</th><th>Action</th></tr></thead>
              <tbody>
                {paid.map(b => (
                  <tr key={b.id}>
                    <td data-label="Type"><span className="badge badge-success">{b.bill_type}</span></td>
                    <td data-label="Amount"><b>₹{b.amount?.toLocaleString()}</b></td>
                    <td data-label="Month">{b.billing_month || '-'}</td>
                    <td data-label="Paid On">{b.paid_date}</td>
                    <td data-label="Action"><button className="btn btn-ghost btn-sm" onClick={() => viewReceipt(b)}>🖨 Receipt</button></td>
                  </tr>
                ))}
                {!paid.length && <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 30 }}>No paid bills yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPayModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>💳 Pay Bill</h3><button className="modal-close" onClick={() => setPayModal(null)}>×</button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--gray-100)', padding: 16, borderRadius: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{payModal.bill_type} – {payModal.billing_month}</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>₹{payModal.amount?.toLocaleString()}</span>
              </div>

              {(paySettings?.upi_id || paySettings?.upi_qr_code) ? (
                <div className="upi-box">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Pay via UPI</div>
                  {paySettings.upi_qr_code && <img src={`${UPLOADS}/${paySettings.upi_qr_code}`} alt="UPI QR" />}
                  {paySettings.upi_id && <div className="upi-id">{paySettings.upi_id}</div>}
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 10 }}>Scan QR or use UPI ID to pay, then upload screenshot below</p>
                </div>
              ) : (
                <div className="alert alert-info">ℹ️ Contact admin for payment details</div>
              )}

              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: 50 }} onClick={handleRazorpay}>
                    <CreditCard size={20} /> Pay Online (Razorpay)
                  </button>
                </div>

                <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--gray-500)', fontSize: 12 }}>- OR -</div>

                <div className="section-title">Upload Payment Screenshot</div>
                <div className="upload-area" onClick={() => document.getElementById('ssInput').click()}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{screenshotFile ? <CheckCircle size={40} color="var(--success)" /> : <Upload size={40} color="var(--gray-400)" />}</div>
                  <p>{screenshotFile ? screenshotFile.name : 'Click to upload payment screenshot'}</p>
                  <input type="file" id="ssInput" accept="image/*" hidden onChange={e => setScreenshotFile(e.target.files[0])} />
                </div>
                {screenshotFile && (
                  <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={uploadScreenshot} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Screenshot'}
                  </button>
                )}
              </div>

              {bills.find(b => b.id === payModal.id)?.payment_screenshot && (
                <div style={{ marginTop: 16 }}>
                  {bills.find(b => b.id === payModal.id)?.status === 'pending_approval' ? (
                    <div className="alert alert-warning">⏳ Payment verification pending. Admin will approve shortly.</div>
                  ) : (
                    <>
                      <div className="alert alert-success">✅ Screenshot uploaded! Click below to confirm payment.</div>
                      <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={markPaid}>
                        ✅ Mark as Paid
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && receipt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReceiptModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>🖨 Payment Receipt</h3><button className="modal-close" onClick={() => setReceiptModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="receipt-content" id="receipt">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="receipt-logo">🏠 RentEase</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gray-500)' }}>
                    <div><b>Receipt No:</b> {receipt.receipt_number}</div>
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
                <div className="receipt-row"><span>Paid On</span><b style={{ color: 'var(--success)' }}>{receipt.paid_date}</b></div>
                <hr className="receipt-divider" />
                <div className="receipt-total"><span>Amount Paid</span><span>₹{receipt.amount?.toLocaleString()}</span></div>
                <div style={{ marginTop: 16, padding: 10, background: '#d1fae5', borderRadius: 8, textAlign: 'center', color: '#065f46', fontWeight: 700 }}>✅ PAYMENT CONFIRMED</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setReceiptModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
