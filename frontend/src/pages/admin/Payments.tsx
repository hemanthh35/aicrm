import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatINR } from '@/lib/utils'

interface Payment { id: number; order_id: number; amount: number; method: string; status: string; created_at: string }

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.get<Payment[]>('/payments').then((r) => setPayments(r.data)) }, [])

  return (
    <div>
      <PageHeader title="Payments" subtitle={`${payments.length} transactions`} />
      <div className="p-6 md:p-8">
        <DataTable
          rows={payments}
          search={{ value: search, onChange: setSearch, placeholder: 'Search payments…', getText: (p) => `TK${10000 + p.order_id} ${p.method} ${p.status} ${p.amount}` }}
          columns={[
            { key: 'order', label: 'Order', render: (p) => `#TK${10000 + p.order_id}` },
            { key: 'amount', label: 'Amount', render: (p) => formatINR(p.amount) },
            { key: 'method', label: 'Method', render: (p) => <span className="capitalize">{p.method}</span> },
            { key: 'status', label: 'Status', render: (p) => <Badge variant="success">{p.status}</Badge> },
            { key: 'date', label: 'Date', render: (p) => new Date(p.created_at).toLocaleString() },
          ]}
        />
      </div>
    </div>
  )
}
