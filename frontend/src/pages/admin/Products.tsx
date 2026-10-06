import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { api, type Product, type Category } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import { formatINR } from '@/lib/utils'

const EMPTY = {
  name: '', brand: '', description: '', price: 0, original_price: 0, stock: 0,
  warranty: '1 Year Warranty', category_id: 0, is_featured: false, image_url: '',
}

export default function AdminProducts({ domain = 'ecommerce' }: { domain?: 'ecommerce' | 'agriculture' }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')

  const load = () => api.get<Product[]>('/products', { params: { domain } }).then((r) => setProducts(r.data))
  useEffect(() => {
    load()
    api.get<Category[]>('/categories', { params: { domain } }).then((r) => setCategories(r.data))
  }, [domain])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ ...p, category_id: p.category_id })
    setOpen(true)
  }

  const save = async () => {
    const payload = { ...form, price: Number(form.price), original_price: Number(form.original_price) || null, stock: Number(form.stock), category_id: Number(form.category_id) }
    try {
      if (editing) await api.put(`/products/${editing.id}`, payload)
      else await api.post('/products', payload)
      setOpen(false)
      load()
      toast(editing ? 'Product updated' : 'Product created')
    } catch (err: any) {
      toast(err?.response?.data?.detail ?? 'Could not save product', 'error')
    }
  }

  const remove = async (p: Product) => {
    try {
      await api.delete(`/products/${p.id}`)
      load()
      toast('Product deleted', 'info')
    } catch {
      toast('Could not delete product', 'error')
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
      <PageHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        actions={<Button onClick={openCreate}><Plus size={16} /> Add Product</Button>}
      />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleProducts}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: 'Search products…',
            getText: (p) => `${p.name} ${p.brand ?? ''} ${p.category?.name ?? ''}`,
          }}
          filters={
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Filter products by stock" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All stock</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          }
          columns={[
            { key: 'name', label: 'Product', render: (p) => (
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-(--color-muted)">{p.brand}</p>
              </div>
            ) },
            { key: 'category', label: 'Category', render: (p) => p.category?.name ?? '—' },
            { key: 'price', label: 'Price', render: (p) => formatINR(p.price) },
            { key: 'stock', label: 'Stock', render: (p) => (
              <Badge variant={p.stock <= 10 ? 'danger' : 'success'}>{p.stock} units</Badge>
            ) },
            { key: 'featured', label: 'Featured', render: (p) => (p.is_featured ? <Badge variant="ecom">Featured</Badge> : '—') },
            { key: 'actions', label: '', className: 'text-right', render: (p) => (
              <div className="flex justify-end gap-2">
                <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 hover:bg-white/10"><Pencil size={15} /></button>
                <button onClick={() => remove(p)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={15} /></button>
              </div>
            ) },
          ]}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="flex flex-col gap-3">
          <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Textarea placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input type="number" placeholder="Original price" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm"
            >
              <option value={0}>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input placeholder="Warranty" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured product
          </label>
          <Button onClick={save}>{editing ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </Modal>
    </div>
  )
}
