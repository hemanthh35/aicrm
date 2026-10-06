import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { api, type Crop } from '@/lib/api'

export default function AdminCrops() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.get<Crop[]>('/crops').then((r) => setCrops(r.data)) }, [])

  return (
    <div>
      <PageHeader title="Crops" subtitle={`${crops.length} crop entries across all farmers`} />
      <div className="p-6 md:p-8">
        <DataTable
          rows={crops}
          search={{ value: search, onChange: setSearch, placeholder: 'Search crops…', getText: (c) => `${c.name} ${c.variety ?? ''} ${c.customer?.name ?? ''}` }}
          columns={[
            { key: 'farmer', label: 'Farmer', render: (c) => c.customer?.name ?? '—' },
            { key: 'name', label: 'Crop', render: (c) => <span className="font-medium">{c.name}</span> },
            { key: 'variety', label: 'Variety', render: (c) => c.variety ?? '—' },
            { key: 'area', label: 'Area', render: (c) => c.area_acres ? `${c.area_acres} acres` : '—' },
            { key: 'planted', label: 'Planted On', render: (c) => c.planted_on ? new Date(c.planted_on).toLocaleDateString() : '—' },
          ]}
        />
      </div>
    </div>
  )
}
