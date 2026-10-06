import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--color-border) px-5 py-7 md:px-8 lg:px-10">
      <div>
        <p className="eyebrow">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm leading-6 text-(--color-muted)">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
