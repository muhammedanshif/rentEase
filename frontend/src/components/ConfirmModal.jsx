import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-body" style={{ textAlign: 'center', padding: 30 }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%', background: type === 'danger' ? '#fee2e2' : '#d1fae5',
                        color: type === 'danger' ? '#dc2626' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <AlertTriangle size={30} />
                    </div>
                    <h3 style={{ marginBottom: 10 }}>{title}</h3>
                    <p style={{ color: 'var(--gray-500)', marginBottom: 25 }}>{message}</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button className={`btn btn-${type}`} onClick={() => { onConfirm(); onClose() }}>{confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
