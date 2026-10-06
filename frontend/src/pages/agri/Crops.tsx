import { useEffect, useState } from 'react'
import { Plus, Sprout } from 'lucide-react'
import { api, type Crop } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Pagination, paginate } from '@/components/ui/pagination'

const CROPS_PAGE_SIZE = 4

export default function Crops() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [crops, setCrops] = useState<Crop[]>([])
  const [cropModal, setCropModal] = useState(false)
  const [cropForm, setCropForm] = useState({ name: '', variety: '', area_acres: '', notes: '' })
  const [cropPage, setCropPage] = useState(1)

  const load = () => {
    api.get<Crop[]>('/crops', { params: { customer_id: user!.id } }).then((r) => setCrops(r.data))
  }
  useEffect(() => { load() }, [user])

  const addCrop = async () => {
    if (!cropForm.name.trim()) return
    try {
      await api.post('/crops', {
        customer_id: user!.id, name: cropForm.name, variety: cropForm.variety || null,
        area_acres: cropForm.area_acres ? Number(cropForm.area_acres) : null, notes: cropForm.notes || null,
      })
      setCropForm({ name: '', variety: '', area_acres: '', notes: '' })
      setCropModal(false)
      setCropPage(1)
      load()
      toast(`${cropForm.name} added to My Crops`)
    } catch {
      toast('Could not add crop', 'error')
    }
  }

  const { pageItems: cropItems, pageCount: cropPageCount, clampedPage: currentCropPage } = paginate(crops, CROPS_PAGE_SIZE, cropPage)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-8 md:px-0">
      <div className="flex items-center justify-between">
        <h1 className="font-(family-name:--font-display) text-xl font-bold">My Crops</h1>
        <Button size="sm" variant="agri" onClick={() => setCropModal(true)}><Plus size={14} /> Add Crop</Button>
      </div>

      <div className="flex flex-col gap-4">
        {crops.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-(--color-surface) px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-agri-primary)/10 text-(--color-agri-primary)">
              <Sprout size={24} />
            </span>
            <p className="text-sm text-(--color-muted)">No crops added yet. Add your first crop to start tracking.</p>
            <Button size="sm" variant="agri" onClick={() => setCropModal(true)}><Plus size={14} /> Add Crop</Button>
          </div>
        )}
        {cropItems.map((c) => (
          <div key={c.id} className="card-lift rounded-3xl bg-(--color-surface) p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{c.name}</p>
              {c.area_acres && <span className="text-xs text-(--color-muted)">{c.area_acres} acres</span>}
            </div>
            {c.variety && <p className="text-xs text-(--color-muted)">{c.variety}</p>}
            {c.planted_on && <p className="mt-1 text-[11px] text-(--color-muted)">Planted {new Date(c.planted_on).toLocaleDateString()}</p>}
          </div>
        ))}
        <Pagination page={currentCropPage} pageCount={cropPageCount} onPageChange={setCropPage} totalItems={crops.length} pageSize={CROPS_PAGE_SIZE} />
      </div>

      <Modal open={cropModal} onClose={() => setCropModal(false)} title="Add Crop">
        <div className="flex flex-col gap-3">
          <Input placeholder="Crop name (e.g. Tomato)" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} />
          <Input placeholder="Variety (optional)" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} />
          <Input type="number" placeholder="Area (acres)" value={cropForm.area_acres} onChange={(e) => setCropForm({ ...cropForm, area_acres: e.target.value })} />
          <Textarea placeholder="Notes (optional)" rows={2} value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} />
          <Button variant="agri" onClick={addCrop}>Add Crop</Button>
        </div>
      </Modal>
    </div>
  )
}
