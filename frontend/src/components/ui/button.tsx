import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-(--color-ecom-primary) text-white hover:bg-(--color-ecom-primary-hover) hover:-translate-y-0.5',
        agri: 'bg-(--color-agri-primary) text-white hover:bg-(--color-agri-primary-hover)',
        secondary: 'bg-(--color-surface) text-(--color-text) border border-(--color-border) hover:border-(--color-text)/30',
        ghost: 'hover:bg-black/5 text-(--color-text)',
        outline: 'border border-(--color-border) text-(--color-text) hover:border-(--color-text)/30',
        danger: 'bg-(--color-danger) text-white hover:brightness-110',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5',
        lg: 'h-14 px-7 text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'
