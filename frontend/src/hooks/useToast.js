import { useState, useCallback } from 'react'
export function useToast() {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type='info') => {
    const id = Date.now()
    setToasts(p => [...p, {id, message, type}])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])
  return { toasts, showToast, removeToast }
}
