import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  growthPct,
  icon: Icon,
  accent = 'ecom',
}: {
  label: string
  value: string
  growthPct?: number
  icon: LucideIcon
  accent?: 'ecom' | 'agri'
}) {
  const positive = (growthPct ?? 0) >= 0
  return (
    <Card className="p-5 transition-shadow hover:shadow-[0_18px_38px_-26px_rgba(25,61,42,0.38)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.12em] text-(--color-muted)">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.06em]">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            accent === 'ecom' ? 'bg-(--color-accent-lime) text-(--color-text)' : 'bg-(--color-agri-primary) text-white'
          )}
        >
          <Icon size={20} />
        </div>
      </div>
      {growthPct !== undefined && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', positive ? 'text-(--color-success)' : 'text-(--color-danger)')}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(growthPct)}% vs last week
        </div>
      )}
    </Card>
  )
}
