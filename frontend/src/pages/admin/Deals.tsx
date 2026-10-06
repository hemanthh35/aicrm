import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { api, type Deal, type Product } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import { formatINR } from '@/lib/utils'

export default function AdminDeals({ domain = 'ecommerce' }: { domain?: 'ecommerce' | 'agriculture' }) {
  const { toast } = useToast()
  const [deals, setDeals] = useState<Deal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ product_id: 0, discount_percent: 10 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(() => api.get<Deal[]>('/deals', { params: { domain } }).then((r) => setDeals(r.data)), [domain])
  useEffect(() => {
    load()
    api.get<Product[]>('/products', { params: { domain } }).then((r) => setProducts(r.data))
  }, [domain, load])

  const save = async () => {
    try {
      await api.post('/deals', form)
      setOpen(false); load()
      toast('Deal created')
    } catch {
      toast('Could not create deal', 'error')
    }
  }
  const toggle = async (d: Deal) => {
    try {
      await api.put(`/deals/${d.id}/toggle`)
      load()
      toast(d.is_active ? 'Deal deactivated' : 'Deal activated')
    } catch {
      toast('Could not update deal', 'error')
    }
  }
  const remove = async (d: Deal) => {
    try {
      await api.delete(`/deals/${d.id}`)
      load()
      toast('Deal removed', 'info')
    } catch {
      toast('Could not remove deal', 'error')
    }
  }

  const visibleDeals = useMemo(() => statusFilter === 'all' ? deals : deals.filter((deal) => statusFilter === 'active' ? deal.is_active : !deal.is_active), [deals, statusFilter])

  return (
    <div>
      <PageHeader
        title="Deals & Offers"
        subtitle={`${deals.length} deals configured`}
        actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> Add Deal</Button>}
      />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleDeals}
          search={{ value: search, onChange: setSearch, placeholder: 'Search deals…', getText: (d) => `${d.product.name} ${d.discount_percent}% ${d.is_active ? 'active' : 'inactive'}` }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter deals by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All deals</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          }
          columns={[
            { key: 'product', label: 'Product', render: (d) => d.product.name },
            { key: 'price', label: 'Price', render: (d) => formatINR(d.product.price) },
            { key: 'discount', label: 'Discount', render: (d) => <Badge variant="danger">{d.discount_percent}% OFF</Badge> },
            { key: 'status', label: 'Status', render: (d) => (
              <button onClick={() => toggle(d)}>
                <Badge variant={d.is_active ? 'success' : 'default'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>
              </button>
            ) },
            { key: 'actions', label: '', className: 'text-right', render: (d) => (
              <button onClick={() => remove(d)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={15} /></button>
            ) },
          ]}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Deal">
        <div className="flex flex-col gap-3">
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}
            className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm"
          >
            <option value={0}>Select product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
          <Button onClick={save}>Create Deal</Button>
        </div>
      </Modal>
    </div>
  )
}
