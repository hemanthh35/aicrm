import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, type AgriDashboardStats, type CategoryShare, type IssueTypeBreakdown } from '@/lib/api'
import { formatINR } from '@/lib/utils'

export default function AgriReports() {
  const [stats, setStats] = useState<AgriDashboardStats | null>(null)
  const [cropShare, setCropShare] = useState<CategoryShare[]>([])
  const [issues, setIssues] = useState<IssueTypeBreakdown[]>([])

  useEffect(() => {
    api.get('/admin/agri-analytics/dashboard').then((r) => setStats(r.data))
    api.get('/admin/agri-analytics/crop-distribution').then((r) => setCropShare(r.data))
    api.get('/admin/agri-analytics/crop-issue-breakdown').then((r) => setIssues(r.data))
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Farmers', String(stats?.total_farmers ?? 0)],
      ['Crop Entries', String(stats?.total_crop_entries ?? 0)],
      ['Agri Orders', String(stats?.total_agri_orders ?? 0)],
      ['Agri Revenue', String(stats?.total_agri_revenue ?? 0)],
      [], ['Crop Distribution', 'Percent'], ...cropShare.map((c) => [c.name, `${c.percent}%`]),
      [], ['Issue Type', 'Count', 'Percent'], ...issues.map((i) => [i.issue_type, String(i.count), `${i.percent}%`]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `agrimart-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Farmers, crops, orders, and crop issue insights"
        actions={<Button variant="agri" onClick={exportCSV}><FileDown size={16} /> Export CSV</Button>}
      />
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-8">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Total Farmers" value={String(stats?.total_farmers ?? '—')} />
            <Row label="Crop Entries" value={String(stats?.total_crop_entries ?? '—')} />
            <Row label="Agri Orders" value={String(stats?.total_agri_orders ?? '—')} />
            <Row label="Agri Revenue" value={formatINR(stats?.total_agri_revenue ?? 0)} />
            <Row label="Crop Issues Reported" value={String(stats?.crop_issues_reported ?? '—')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Crop Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {cropShare.map((c) => <Row key={c.name} label={c.name} value={`${c.percent}%`} />)}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Crop Issue Breakdown</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {issues.map((i) => <Row key={i.issue_type} label={i.issue_type.replace('_', ' ')} value={`${i.count} (${i.percent}%)`} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-(--color-border) py-1.5 capitalize last:border-0">
      <span className="text-(--color-muted)">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
