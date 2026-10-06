import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, type Product } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import { Check, Pencil, X } from 'lucide-react'

export default function AdminInventory({ domain = 'ecommerce' }: { domain?: 'ecommerce' | 'agriculture' }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftStock, setDraftStock] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')

  const load = useCallback(
    () => api.get<Product[]>('/products', { params: { domain } }).then((r) => setProducts(r.data.sort((a, b) => a.stock - b.stock))),
    [domain]
  )
  useEffect(() => { void load() }, [load])

  const beginEdit = (p: Product) => {
    setEditingId(p.id)
    setDraftStock(String(p.stock))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftStock('')
  }

  const updateStock = async (p: Product) => {
    const stock = Number(draftStock)
    if (!Number.isInteger(stock) || stock < 0) {
      toast('Enter a whole number of zero or more', 'error')
      return
    }

    setSavingId(p.id)
    try {
      await api.put(`/products/${p.id}`, { stock })
      await load()
      cancelEdit()
      toast(`${p.name} stock updated to ${stock}`)
    } catch {
      toast('Could not update stock', 'error')
    } finally {
      setSavingId(null)
    }
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    if (stockFilter === 'out') return product.stock === 0
    if (stockFilter === 'low') return product.stock > 0 && product.stock <= 10
    if (stockFilter === 'in') return product.stock > 10
    return true
  }), [products, stockFilter])

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage stock levels across all products" />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleProducts}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search inventory…',
            getText: (p) => `${p.name} ${p.brand ?? ''} ${p.category?.name ?? ''}`,
          }}
          filters={
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Filter inventory by stock" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All stock</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          }
          columns={[
            { key: 'name', label: 'Product', render: (p) => <span className="font-medium">{p.name}</span> },
            { key: 'category', label: 'Category', render: (p) => p.category?.name ?? '—' },
            { key: 'stock', label: 'Stock', render: (p) => (
              editingId === p.id ? (
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draftStock}
                  className="h-9 w-24"
                  autoFocus
                  onChange={(e) => setDraftStock(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void updateStock(p)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                />
              ) : (
                <span className="font-medium tabular-nums">{p.stock}</span>
              )
            ) },
            { key: 'status', label: 'Status', render: (p) => (
              p.stock === 0 ? <Badge variant="danger">Out of stock</Badge> :
              p.stock <= 10 ? <Badge variant="warning">Low stock</Badge> :
              <Badge variant="success">In stock</Badge>
            ) },
            { key: 'actions', label: 'Actions', className: 'w-48', render: (p) => (
              editingId === p.id ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => void updateStock(p)} disabled={savingId === p.id}>
                    <Check size={14} /> {savingId === p.id ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={savingId === p.id}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => beginEdit(p)}>
                  <Pencil size={14} /> Edit
                </Button>
              )
            ) },
          ]}
        />
      </div>
    </div>
  )
}
