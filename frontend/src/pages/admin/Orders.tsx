import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { api, type Order } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import { formatINR } from '@/lib/utils'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_VARIANT: Record<string, any> = { delivered: 'success', processing: 'ecom', shipped: 'warning', pending: 'default', cancelled: 'danger' }

export default function AdminOrders({ domain = 'ecommerce' }: { domain?: 'ecommerce' | 'agriculture' }) {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => api.get<Order[]>('/orders', { params: { domain } }).then((r) => setOrders(r.data))
  useEffect(() => { load() }, [domain])

  const updateStatus = async (o: Order, status: string) => {
    try {
      await api.put(`/orders/${o.id}/status`, { status })
      load()
      toast(`Order #TK${10000 + o.id} marked ${status}`)
    } catch {
      toast('Could not update order status', 'error')
    }
  }

  const visibleOrders = useMemo(() => statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter), [orders, statusFilter])

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`} />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleOrders}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search orders…',
            getText: (o) => `TK${10000 + o.id} ${o.payment_method} ${o.status} ${o.items.map((item) => item.product?.name ?? '').join(' ')}`,
          }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter orders by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
          }
          columns={[
            { key: 'id', label: 'Order ID', render: (o) => <span className="font-semibold">#TK{10000 + o.id}</span> },
            { key: 'items', label: 'Items', render: (o) => `${o.items.length} item(s)` },
            { key: 'total', label: 'Total', render: (o) => formatINR(o.total_amount) },
            { key: 'payment', label: 'Payment', render: (o) => <span className="capitalize">{o.payment_method}</span> },
            { key: 'date', label: 'Date', render: (o) => new Date(o.created_at).toLocaleDateString() },
            { key: 'status', label: 'Status', render: (o) => (
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o, e.target.value)}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) },
          ]}
        />
      </div>
    </div>
  )
}
