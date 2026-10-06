import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'

export function AdminListToolbar({
  value,
  onChange,
  placeholder = 'Search…',
  filters,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  filters?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-(--color-border) bg-(--color-surface-2) p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted)" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 pl-9"
        />
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
    </div>
  )
}
