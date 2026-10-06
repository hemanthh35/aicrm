import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { api, type Category } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'

export default function AdminCategories({ domain = 'ecommerce' }: { domain?: 'ecommerce' | 'agriculture' }) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')

  const load = () => api.get<Category[]>('/categories', { params: { domain } }).then((r) => setCategories(r.data))
  useEffect(() => { load() }, [domain])

  const save = async () => {
    try {
      if (editing) await api.put(`/categories/${editing.id}`, { name, domain })
      else await api.post('/categories', { name, domain })
      setOpen(false); setName(''); load()
      toast(editing ? 'Category updated' : 'Category created')
    } catch {
      toast('Could not save category', 'error')
    }
  }
  const remove = async (c: Category) => {
    try {
      await api.delete(`/categories/${c.id}`)
      load()
      toast('Category deleted', 'info')
    } catch {
      toast('Could not delete category', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={<Button onClick={() => { setEditing(null); setName(''); setOpen(true) }}><Plus size={16} /> Add Category</Button>}
      />
      <div className="p-6 md:p-8">
        <DataTable
          rows={categories}
          search={{ value: search, onChange: setSearch, placeholder: 'Search categories…', getText: (c) => c.name }}
          columns={[
            { key: 'name', label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
            { key: 'actions', label: '', className: 'text-right', render: (c) => (
              <div className="flex justify-end gap-2">
                <button onClick={() => { setEditing(c); setName(c.name); setOpen(true) }} className="rounded-lg p-1.5 hover:bg-white/10"><Pencil size={15} /></button>
                <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={15} /></button>
              </div>
            ) },
          ]}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="flex flex-col gap-3">
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={save}>{editing ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </Modal>
    </div>
  )
}
