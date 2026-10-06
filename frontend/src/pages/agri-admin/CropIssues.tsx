import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { api, type CropIssue } from '@/lib/api'
import { AIRecommendationCard } from '@/components/agri/AIRecommendationCard'

const STATUSES = ['reported', 'under_review', 'resolved']
const STATUS_VARIANT: Record<string, any> = { reported: 'warning', under_review: 'ecom', resolved: 'success' }

export default function AdminCropIssues() {
  const [issues, setIssues] = useState<CropIssue[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => api.get<CropIssue[]>('/crop-issues').then((r) => setIssues(r.data))
  useEffect(() => { load() }, [])

  const updateStatus = async (issue: CropIssue, status: string) => {
    await api.put(`/crop-issues/${issue.id}/status`, { status })
    load()
  }

  const visibleIssues = useMemo(() => statusFilter === 'all' ? issues : issues.filter((issue) => issue.status === statusFilter), [issues, statusFilter])

  return (
    <div>
      <PageHeader title="Crop Issues" subtitle={`${issues.length} issues reported by farmers`} />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleIssues}
          search={{ value: search, onChange: setSearch, placeholder: 'Search crop issues…', getText: (i) => `${i.customer?.name ?? ''} ${i.crop?.name ?? ''} ${i.issue_type} ${i.description}` }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter crop issues by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
          }
          columns={[
            { key: 'photo', label: 'Photo', render: (i) => i.image_url ? (
              <img src={i.image_url} alt="Crop issue" className="h-12 w-12 rounded-lg object-cover" />
            ) : '—' },
            { key: 'farmer', label: 'Farmer', render: (i) => i.customer?.name ?? '—' },
            { key: 'crop', label: 'Crop', render: (i) => i.crop?.name ?? '—' },
            { key: 'type', label: 'Issue Type', render: (i) => <span className="capitalize">{i.issue_type.replace('_', ' ')}</span> },
            { key: 'description', label: 'Description', className: 'max-w-xs', render: (i) => <span className="line-clamp-2 text-(--color-muted)">{i.description}</span> },
            { key: 'ai', label: 'AI Recommendation', className: 'max-w-xs', render: (i) => i.ai_recommendation ? (
              <AIRecommendationCard value={i.ai_recommendation} issueType={i.issue_type} compact />
            ) : '—' },
            { key: 'status', label: 'Status', render: (i) => (
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[i.status]}>{i.status.replace('_', ' ')}</Badge>
                <select value={i.status} onChange={(e) => updateStatus(i, e.target.value)} className="rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            ) },
            { key: 'date', label: 'Date', render: (i) => new Date(i.created_at).toLocaleDateString() },
          ]}
        />
      </div>
    </div>
  )
}
