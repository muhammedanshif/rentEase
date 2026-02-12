import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />
}

export default function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
          <div className="toast-icon">{ICONS[t.type]}</div>
          <div className="toast-msg">{t.message}</div>
          <button className="toast-x">×</button>
        </div>
      ))}
    </div>
  )
}
