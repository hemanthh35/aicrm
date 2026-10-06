import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { TicketThread } from '@/components/TicketThread'
import { api, type Ticket } from '@/lib/api'

const STATUSES = ['open', 'in_progress', 'closed']
const STATUS_VARIANT: Record<string, any> = { open: 'danger', in_progress: 'warning', closed: 'success' }

export default function AdminSupportTickets({ role = 'customer' }: { role?: 'customer' | 'farmer' }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [active, setActive] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () =>
    api.get<Ticket[]>('/support-tickets', { params: { role } }).then((r) =>
      setTickets([...r.data].sort((a, b) =>
        Number(b.is_escalated) - Number(a.is_escalated) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
        b.id - a.id
      ))
    )
  useEffect(() => { load() }, [role])

  const updateStatus = async (t: Ticket, status: string) => {
    await api.put(`/support-tickets/${t.id}/status`, { status })
    load()
  }

  const openThread = (t: Ticket) => setActive(t)

  const onThreadChanged = (updated: Ticket) => {
    setActive(updated)
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const openCount = tickets.filter((t) => t.status === 'open').length
  const escalatedCount = tickets.filter((t) => t.is_escalated).length
  const visibleTickets = useMemo(() => statusFilter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === statusFilter), [tickets, statusFilter])

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        subtitle={`${tickets.length} tickets · ${openCount} awaiting a reply${escalatedCount ? ` · ${escalatedCount} escalated` : ''}`}
      />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleTickets}
          onRowClick={openThread}
          rowClassName={(t) => (t.is_escalated ? 'bg-(--color-danger)/5' : '')}
          search={{ value: search, onChange: setSearch, placeholder: 'Search support tickets…', getText: (t) => `${t.customer?.name ?? ''} ${t.subject} ${t.message} ${t.status}` }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter support tickets by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
          }
          columns={[
            { key: 'customer', label: 'Customer', render: (t) => t.customer?.name ?? '—' },
            { key: 'subject', label: 'Subject', render: (t) => (
              <span className="flex items-center gap-1.5 font-medium">
                {t.is_escalated && <AlertTriangle size={14} className="text-(--color-danger)" />}
                {t.subject}
              </span>
            ) },
            { key: 'message', label: 'Last message', className: 'max-w-xs', render: (t) => (
              <span className="line-clamp-1 text-(--color-muted)">
                {t.messages[t.messages.length - 1]?.message ?? t.message}
              </span>
            ) },
            { key: 'thread', label: '', render: (t) => (
              <span className="flex items-center gap-1 text-xs text-(--color-muted)">
                <MessageCircle size={13} /> {t.messages.length}
              </span>
            ) },
            { key: 'status', label: 'Status', render: (t) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace('_', ' ')}</Badge>
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t, e.target.value)}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            ) },
            { key: 'date', label: 'Date', render: (t) => new Date(t.created_at).toLocaleDateString() },
          ]}
        />
      </div>

      <TicketThread
        ticket={active}
        onClose={() => setActive(null)}
        viewAs="admin"
        onChanged={onThreadChanged}
      />
    </div>
  )
}
