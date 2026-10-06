import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminListToolbar } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { api, type Advisory } from '@/lib/api'

const EMPTY = { title: '', content: '', crop_type: '' }

export default function AdminAdvisories() {
  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')

  const load = () => api.get<Advisory[]>('/advisories').then((r) => setAdvisories(r.data))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    await api.post('/advisories', form)
    setForm(EMPTY); setOpen(false); load()
  }
  const remove = async (a: Advisory) => { if (confirm(`Delete "${a.title}"?`)) { await api.delete(`/advisories/${a.id}`); load() } }
  const visibleAdvisories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return advisories.filter((advisory) => `${advisory.title} ${advisory.content} ${advisory.crop_type ?? ''}`.toLocaleLowerCase().includes(query))
  }, [advisories, search])

  return (
    <div>
      <PageHeader
        title="Advisories & Tips"
        subtitle={`${advisories.length} farming tips published`}
        actions={<Button variant="agri" onClick={() => setOpen(true)}><Plus size={16} /> Add Advisory</Button>}
      />
      <div className="px-6 pt-6 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <AdminListToolbar value={search} onChange={setSearch} placeholder="Search advisories…" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:p-8 xl:grid-cols-3">
        {visibleAdvisories.map((a) => (
          <div key={a.id} className="flex flex-col gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-(--color-agri-primary)" />
                <p className="font-semibold">{a.title}</p>
              </div>
              <button onClick={() => remove(a)} className="flex-shrink-0 rounded-lg p-1 text-(--color-danger) hover:bg-white/10"><Trash2 size={14} /></button>
            </div>
            {a.crop_type && <span className="w-fit rounded-full bg-(--color-agri-primary)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-agri-primary)">{a.crop_type}</span>}
            <p className="text-sm text-(--color-muted)">{a.content}</p>
          </div>
        ))}
        {visibleAdvisories.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-(--color-border) p-10 text-center text-(--color-muted)">
            <BookOpen size={22} />
            <p className="text-sm">No advisories published yet.</p>
          </div>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Advisory">
        <div className="flex flex-col gap-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Crop type (optional, e.g. Tomato)" value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} />
          <Textarea placeholder="Advice content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Button variant="agri" onClick={save}>Publish Advisory</Button>
        </div>
      </Modal>
    </div>
  )
}
