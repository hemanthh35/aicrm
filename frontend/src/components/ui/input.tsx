import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 text-sm text-(--color-text) placeholder:text-(--color-muted) outline-none transition-all focus:border-(--color-ecom-primary) focus:ring-4 focus:ring-(--color-accent-lime)/25',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-3xl border border-(--color-border) bg-(--color-surface) px-5 py-3.5 text-sm placeholder:text-(--color-muted) outline-none focus:border-(--color-text)/30 transition-shadow',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
