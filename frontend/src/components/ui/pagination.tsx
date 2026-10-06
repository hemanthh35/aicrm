import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
}) {
  if (pageCount <= 1) return null

  const pages = buildPageList(page, pageCount)
  const rangeStart = totalItems !== undefined && pageSize ? (page - 1) * pageSize + 1 : null
  const rangeEnd = totalItems !== undefined && pageSize ? Math.min(page * pageSize, totalItems) : null

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-(--color-border) px-5 py-3.5 sm:flex-row">
      {rangeStart !== null && (
        <p className="text-xs text-(--color-muted)">
          Showing {rangeStart}–{rangeEnd} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-white/10 hover:text-(--color-text) disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-(--color-muted)">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                p === page ? 'bg-(--color-ecom-primary) text-white' : 'text-(--color-muted) hover:bg-white/10 hover:text-(--color-text)'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-white/10 hover:text-(--color-text) disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function buildPageList(current: number, total: number): (number | '...')[] {
  const delta = 1
  const range: (number | '...')[] = []
  const start = Math.max(2, current - delta)
  const end = Math.min(total - 1, current + delta)

  range.push(1)
  if (start > 2) range.push('...')
  for (let i = start; i <= end; i++) range.push(i)
  if (end < total - 1) range.push('...')
  if (total > 1) range.push(total)

  return range
}

/** Client-side pagination helper: slices `items` to the current page. */
export function paginate<T>(items: T[], pageSize: number, page: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const clampedPage = Math.min(Math.max(1, page), pageCount)
  const start = (clampedPage - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return { pageItems, pageCount, clampedPage }
}
