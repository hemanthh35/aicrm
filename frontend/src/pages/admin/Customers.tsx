import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { api, type Customer } from '@/lib/api'

export default function AdminCustomers({ role = 'customer', title = 'Customers' }: { role?: 'customer' | 'farmer'; title?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.get<Customer[]>('/customers', { params: { role } }).then((r) => setCustomers(r.data)) }, [role])

  return (
    <div>
      <PageHeader title={title} subtitle={`${customers.length} registered ${role === 'farmer' ? 'farmers' : 'customers'}`} />
      <div className="p-6 md:p-8">
        <DataTable
          rows={customers}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: `Search ${role === 'farmer' ? 'farmers' : 'customers'}…`,
            getText: (c) => `${c.name} ${c.email} ${c.phone ?? ''} ${c.city ?? ''}`,
          }}
          columns={[
            { key: 'name', label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
            { key: 'email', label: 'Email', render: (c) => c.email },
            { key: 'phone', label: 'Phone', render: (c) => c.phone ?? '—' },
            { key: 'city', label: 'City', render: (c) => c.city ?? '—' },
            { key: 'joined', label: 'Joined', render: (c) => new Date(c.created_at).toLocaleDateString() },
          ]}
        />
      </div>
    </div>
  )
}
