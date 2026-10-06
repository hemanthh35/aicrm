import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Landmark } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { api, type Scheme } from '@/lib/api'

const EMPTY = { title: '', description: '', link_url: '', is_active: true }

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => api.get<Scheme[]>('/schemes').then((r) => setSchemes(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim()) return
    await api.post('/schemes', form)
    setForm(EMPTY); setOpen(false); load()
  }
  const toggle = async (s: Scheme) => { await api.put(`/schemes/${s.id}`, { ...s, is_active: !s.is_active }); load() }
  const remove = async (s: Scheme) => { if (confirm(`Delete "${s.title}"?`)) { await api.delete(`/schemes/${s.id}`); load() } }
  const visibleSchemes = useMemo(() => statusFilter === 'all' ? schemes : schemes.filter((scheme) => statusFilter === 'active' ? scheme.is_active : !scheme.is_active), [schemes, statusFilter])

  return (
    <div>
      <PageHeader
        title="Schemes & Announcements"
        subtitle={`${schemes.length} government schemes listed`}
        actions={<Button variant="agri" onClick={() => setOpen(true)}><Plus size={16} /> Add Scheme</Button>}
      />
      <div className="p-6 md:p-8">
        <DataTable
          rows={visibleSchemes}
          search={{ value: search, onChange: setSearch, placeholder: 'Search schemes…', getText: (s) => `${s.title} ${s.description}` }}
          filters={
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter schemes by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
              <option value="all">All schemes</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          }
          columns={[
            { key: 'title', label: 'Title', render: (s) => (
              <div className="flex items-center gap-2">
                <Landmark size={14} className="text-(--color-agri-primary)" />
                <span className="font-medium">{s.title}</span>
              </div>
            ) },
            { key: 'description', label: 'Description', className: 'max-w-sm', render: (s) => <span className="line-clamp-2 text-(--color-muted)">{s.description}</span> },
            { key: 'status', label: 'Status', render: (s) => (
              <button onClick={() => toggle(s)}><Badge variant={s.is_active ? 'success' : 'default'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></button>
            ) },
            { key: 'actions', label: '', className: 'text-right', render: (s) => (
              <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={15} /></button>
            ) },
          ]}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Scheme">
        <div className="flex flex-col gap-3">
          <Input placeholder="Scheme title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Link URL (optional)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <Button variant="agri" onClick={save}>Publish Scheme</Button>
        </div>
      </Modal>
    </div>
  )
}
