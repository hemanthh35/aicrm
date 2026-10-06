import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-black/[0.06] text-(--color-text)',
      success: 'bg-(--color-success)/12 text-(--color-success)',
      warning: 'bg-(--color-warning)/12 text-(--color-warning)',
      danger: 'bg-(--color-danger)/12 text-(--color-danger)',
      ecom: 'bg-(--color-ecom-primary)/10 text-(--color-ecom-primary)',
      agri: 'bg-(--color-agri-primary)/10 text-(--color-agri-primary)',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
