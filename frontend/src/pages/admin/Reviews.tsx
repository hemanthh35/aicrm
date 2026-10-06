import { useEffect, useMemo, useState } from 'react'
import { Trash2, Star } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { api, type Review } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'

export default function AdminReviews() {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => api.get<Review[]>('/reviews').then((r) => setReviews(r.data))
  useEffect(() => { load() }, [])

  const approve = async (r: Review) => {
    try {
      await api.put(`/reviews/${r.id}/approve`)
      load()
      toast('Review approved')
    } catch {
      toast('Could not approve review', 'error')
    }
  }
  const remove = async (r: Review) => {
    try {
      await api.delete(`/reviews/${r.id}`)
      load()
      toast('Review deleted', 'info')
    } catch {
      toast('Could not delete review', 'error')
    }
  }

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
  const pendingCount = reviews.filter((review) => !review.is_approved).length
  const fiveStarCount = reviews.filter((review) => review.rating === 5).length
  const visibleReviews = useMemo(() => statusFilter === 'all' ? reviews : reviews.filter((review) => statusFilter === 'approved' ? review.is_approved : !review.is_approved), [reviews, statusFilter])

  return (
    <div>
      <PageHeader title="Reviews" subtitle={`${reviews.length} customer reviews`} />
      <div className="p-6 md:p-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><p className="text-xs text-(--color-muted)">Average rating</p><div className="mt-2 flex items-center gap-2"><span className="text-2xl font-semibold tracking-[-0.05em]">{averageRating ? averageRating.toFixed(1) : '—'}</span><span className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} className={index < Math.round(averageRating) ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} />)}</span></div></div>
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><p className="text-xs text-(--color-muted)">Awaiting approval</p><p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{pendingCount}</p><p className="mt-1 text-xs text-(--color-muted)">Reviews to moderate</p></div>
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><p className="text-xs text-(--color-muted)">Five-star reviews</p><p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{fiveStarCount}</p><p className="mt-1 text-xs text-(--color-muted)">Top customer ratings</p></div>
        </div>
        <DataTable
          rows={visibleReviews}
          search={{ value: search, onChange: setSearch, placeholder: 'Search reviews…', getText: (r) => `${r.customer?.name ?? 'anonymous'} ${r.comment} ${r.rating} ${r.is_approved ? 'approved' : 'pending'}` }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter reviews by approval status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          }
          columns={[
            { key: 'customer', label: 'Customer', render: (r) => r.customer?.name ?? 'Anonymous' },
            { key: 'rating', label: 'Rating', render: (r) => (
              <span className="flex items-center gap-2" aria-label={`${r.rating} out of 5 stars`}><span className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={12} className={index < r.rating ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} />)}</span><span className="text-xs font-semibold">{r.rating}/5</span></span>
            ) },
            { key: 'comment', label: 'Comment', className: 'max-w-xs', render: (r) => <span className="line-clamp-2 text-(--color-muted)">{r.comment}</span> },
            { key: 'status', label: 'Status', render: (r) => (
              <button onClick={() => approve(r)}><Badge variant={r.is_approved ? 'success' : 'warning'}>{r.is_approved ? 'Approved' : 'Pending'}</Badge></button>
            ) },
            { key: 'actions', label: '', className: 'text-right', render: (r) => (
              <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={15} /></button>
            ) },
          ]}
        />
      </div>
    </div>
  )
}
