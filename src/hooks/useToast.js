import { useState, useRef } from 'react'

/**
 * useToast — single-slot toast manager.
 * Incrementing `key` forces the Toast component to remount on each call,
 * replaying the slide-in animation even when replacing an existing toast.
 */
export function useToast() {
  const [state, setState] = useState({ message: null, key: 0 })
  const timerRef = useRef(null)

  const showToast = (message) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState(prev => ({ message, key: prev.key + 1 }))
    timerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, message: null }))
    }, 2000)
  }

  return { toastMessage: state.message, toastKey: state.key, showToast }
}
