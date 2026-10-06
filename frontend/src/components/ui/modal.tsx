import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'card-lift relative w-full max-w-lg rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 animate-in fade-in zoom-in-95',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-(family-name:--font-display) text-lg font-semibold">{title}</h3>}
          <button onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
