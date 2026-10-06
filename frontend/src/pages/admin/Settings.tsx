import { useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminSettings({
  defaults = { name: 'TechKart', tagline: 'Smart Devices, Smarter Life', email: 'support@techkart.com', phone: '1800-123-4567' },
}: {
  defaults?: { name: string; tagline: string; email: string; phone: string }
}) {
  const [store, setStore] = useState(defaults)

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store profile and preferences" />
      <div className="max-w-xl p-6 md:p-8">
        <Card>
          <CardHeader><CardTitle>Store Profile</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-muted)">Store Name</label>
              <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-muted)">Tagline</label>
              <Input value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-muted)">Support Email</label>
              <Input value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-muted)">Support Phone</label>
              <Input value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
            </div>
            <Button className="mt-2 w-fit">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
