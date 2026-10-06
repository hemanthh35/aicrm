import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { AdminListToolbar } from '@/components/admin/AdminListToolbar'

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  empty = 'No data yet.',
  onRowClick,
  pageSize = 10,
  rowClassName,
  search,
  filters,
}: {
  columns: { key: string; label: string; render: (row: T) => ReactNode; className?: string }[]
  rows: T[]
  empty?: string
  onRowClick?: (row: T) => void
  pageSize?: number
  rowClassName?: (row: T) => string
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    getText?: (row: T) => string
  }
  filters?: ReactNode
}) {
  const [page, setPage] = useState(1)
  const filteredRows = useMemo(() => {
    const query = search?.value.trim().toLocaleLowerCase()
    if (!query) return rows
    return rows.filter((row) => {
      const text = search?.getText?.(row) ?? Object.values(row).join(' ')
      return text.toLocaleLowerCase().includes(query)
    })
  }, [rows, search])
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const pageRows = filteredRows.slice(start, start + pageSize)

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
      {(search || filters) && (
        <AdminListToolbar
          value={search?.value ?? ''}
          onChange={search?.onChange ?? (() => undefined)}
          placeholder={search?.placeholder}
          filters={filters}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-(--color-border) text-xs uppercase tracking-wide text-(--color-muted)">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-5 py-3 font-medium', c.className)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-(--color-muted)">
                  {rows.length === 0 ? empty : 'No matching records.'}
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-(--color-border) last:border-0 hover:bg-white/[0.03]',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row)
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3.5', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} totalItems={filteredRows.length} pageSize={pageSize} />
    </div>
  )
}
