import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-fade-up pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-2xl backdrop-blur',
              t.type === 'success' && 'border-(--color-success)/30 bg-(--color-surface)/95 text-(--color-text)',
              t.type === 'error' && 'border-(--color-danger)/30 bg-(--color-surface)/95 text-(--color-text)',
              t.type === 'info' && 'border-(--color-border) bg-(--color-surface)/95 text-(--color-text)'
            )}
          >
            {t.type === 'success' && <CheckCircle2 size={16} className="flex-shrink-0 text-(--color-success)" />}
            {t.type === 'error' && <XCircle size={16} className="flex-shrink-0 text-(--color-danger)" />}
            {t.type === 'info' && <Info size={16} className="flex-shrink-0 text-(--color-ecom-primary)" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
