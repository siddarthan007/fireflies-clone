'use client'

import { Check, CircleAlert } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  kind: 'success' | 'error'
}

type Show = (message: string, kind?: ToastItem['kind']) => void

const ToastContext = createContext<Show>(() => {})

export function useToast(): Show {
  return useContext(ToastContext)
}

// Provides useToast() to the whole app and draws the toasts at the bottom center.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback<Show>((message, kind = 'success') => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message, kind }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-in flex min-h-[54px] items-center gap-3 rounded-lg bg-contrast px-5 py-3 text-sm text-on-contrast shadow-menu"
          >
            {toast.kind === 'error' ? (
              <CircleAlert size={20} className="text-danger-strong" />
            ) : (
              <Check size={20} className="text-success-strong" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
