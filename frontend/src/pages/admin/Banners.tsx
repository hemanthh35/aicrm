import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, ImageOff } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminListToolbar } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { FallbackImage } from '@/components/FallbackImage'
import { Pagination, paginate } from '@/components/ui/pagination'
import { api, type Banner } from '@/lib/api'

const EMPTY_FORM = { title: '', image_url: '', link_url: '', is_active: true }
const PAGE_SIZE = 6

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const visibleBanners = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return banners.filter((banner) => {
      const matchesSearch = !query || `${banner.title} ${banner.link_url ?? ''}`.toLocaleLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? banner.is_active : !banner.is_active)
      return matchesSearch && matchesStatus
    })
  }, [banners, search, statusFilter])
  const { pageItems, pageCount, clampedPage } = paginate(visibleBanners, PAGE_SIZE, page)

  const load = () => api.get<Banner[]>('/banners').then((r) => setBanners(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  const openEdit = (b: Banner) => {
    setEditing(b)
    setForm({ title: b.title, image_url: b.image_url ?? '', link_url: b.link_url ?? '', is_active: b.is_active })
    setOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    if (editing) await api.put(`/banners/${editing.id}`, form)
    else await api.post('/banners', form)
    setOpen(false)
    load()
  }
  const toggle = async (b: Banner) => { await api.put(`/banners/${b.id}`, { ...b, is_active: !b.is_active }); load() }
  const remove = async (b: Banner) => { if (confirm(`Delete banner "${b.title}"?`)) { await api.delete(`/banners/${b.id}`); load() } }

  return (
    <div>
      <PageHeader
        title="Banners"
        subtitle={`${banners.length} promotional banners · shown on the storefront home screen`}
        actions={<Button onClick={openCreate}><Plus size={16} /> Add Banner</Button>}
      />
      <div className="px-6 pt-6 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <AdminListToolbar
            value={search}
            onChange={(value) => { setSearch(value); setPage(1) }}
            placeholder="Search banners…"
            filters={
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} aria-label="Filter banners by status" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
                <option value="all">All banners</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:p-8 xl:grid-cols-3">
        {pageItems.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
            <div className="relative aspect-[3/1] bg-(--color-surface-2)">
              <FallbackImage src={b.image_url} alt={b.title} />
              <button onClick={() => toggle(b)} className="absolute right-2 top-2">
                <Badge variant={b.is_active ? 'success' : 'default'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.title}</p>
                <p className="truncate text-xs text-(--color-muted)">{b.link_url || 'No link set'}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-(--color-muted) hover:bg-white/10 hover:text-(--color-text)"><Pencil size={14} /></button>
                <button onClick={() => remove(b)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {visibleBanners.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-(--color-border) p-10 text-center text-(--color-muted)">
            <ImageOff size={22} />
            <p className="text-sm">No banners yet. Add one to show it on the storefront.</p>
          </div>
        )}
      </div>
      {visibleBanners.length > 0 && (
        <div className="px-6 md:px-8">
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={visibleBanners.length} pageSize={PAGE_SIZE} />
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'}>
        <div className="flex flex-col gap-3">
          <Input placeholder="Banner title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Image URL (e.g. https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1200&h=400&q=85)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          {form.image_url && (
            <div className="aspect-[3/1] overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface-2)">
              <FallbackImage src={form.image_url} alt="preview" />
            </div>
          )}
          <Input placeholder="Link URL (e.g. /deals)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-(--color-muted)">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible on storefront)
          </label>
          <Button onClick={save}>{editing ? 'Save Changes' : 'Create Banner'}</Button>
        </div>
      </Modal>
    </div>
  )
}
