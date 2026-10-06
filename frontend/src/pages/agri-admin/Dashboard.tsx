import { useEffect, useState } from 'react'
import { Users, Sprout, ShoppingBag, IndianRupee, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { api, type AgriDashboardStats, type SalesPoint, type CategoryShare, type IssueTypeBreakdown } from '@/lib/api'
import { formatINR } from '@/lib/utils'

const ISSUE_COLORS: Record<string, string> = {
  leaf_disease: '#d65a4a', pest_attack: '#d89a2e', nutrient_deficiency: '#8b6fd9',
  weather_damage: '#4cabb2', other: '#9aa993',
}
const CATEGORY_COLORS = ['#317a45', '#b8ef3f', '#d89a2e', '#4cabb2', '#8b6fd9']

function formatIssueType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AgriDashboard() {
  const [stats, setStats] = useState<AgriDashboardStats | null>(null)
  const [trend, setTrend] = useState<SalesPoint[]>([])
  const [cropShare, setCropShare] = useState<CategoryShare[]>([])
  const [issueBreakdown, setIssueBreakdown] = useState<IssueTypeBreakdown[]>([])

  useEffect(() => {
    api.get('/admin/agri-analytics/dashboard').then((r) => setStats(r.data))
    api.get('/admin/agri-analytics/farmer-registration-trend').then((r) => setTrend(r.data))
    api.get('/admin/agri-analytics/crop-distribution').then((r) => setCropShare(r.data))
    api.get('/admin/agri-analytics/crop-issue-breakdown').then((r) => setIssueBreakdown(r.data))
  }, [])

  return (
    <div>
      <PageHeader title="Welcome, Admin!" subtitle="Here's what's happening on your agriculture platform today." />
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Farmers" value={stats ? String(stats.total_farmers) : '—'} icon={Users} accent="agri" />
          <StatCard label="Crop Entries" value={stats ? String(stats.total_crop_entries) : '—'} icon={Sprout} accent="agri" />
          <StatCard label="Agri Orders" value={stats ? String(stats.total_agri_orders) : '—'} icon={ShoppingBag} accent="agri" />
          <StatCard label="Agri Revenue" value={stats ? formatINR(stats.total_agri_revenue) : '—'} icon={IndianRupee} accent="agri" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>Farmer Registration Growth</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis dataKey="label" stroke="#9AA1A9" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#15181C', border: '1px solid #262A2F', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#2FA84F" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Crop Distribution</CardTitle></CardHeader>
            <CardContent className="flex h-64 items-center gap-4">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={cropShare} dataKey="percent" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {cropShare.map((c, i) => <Cell key={c.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 text-xs">
                {cropShare.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="text-(--color-muted)">{c.name}</span>
                    <span className="font-semibold">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={16} className="text-(--color-warning)" /> Crop Issue Analysis</CardTitle></CardHeader>
          <CardContent className="h-72 px-4 sm:px-6">
            {issueBreakdown.length > 0 ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueBreakdown} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 8 }} barCategoryGap="28%">
                <XAxis type="number" stroke="#9aa993" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="issue_type" width={132} stroke="#6c7d6c" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatIssueType} />
                <Tooltip cursor={{ fill: '#f0f4e6' }} contentStyle={{ background: '#fffef7', border: '1px solid #dfe2cf', borderRadius: 14, color: '#193d2a', boxShadow: '0 12px 28px rgba(25,61,42,0.12)' }} labelFormatter={(value) => formatIssueType(String(value))} formatter={(value) => [value, 'Reports']} />
                <Bar dataKey="count" barSize={22} maxBarSize={22} radius={[0, 8, 8, 0]}>
                  {issueBreakdown.map((d) => <Cell key={d.issue_type} fill={ISSUE_COLORS[d.issue_type] ?? '#317a45'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-(--color-muted)">No crop issue data yet.</div>}
          </CardContent>
          <CardContent className="grid grid-cols-2 gap-3 border-t border-(--color-border) pt-4 sm:grid-cols-3 xl:grid-cols-5">
            {issueBreakdown.map((d) => (
              <div key={d.issue_type} className="min-w-0 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 text-center">
                <span className="mx-auto mb-2 block h-1.5 w-10 rounded-full" style={{ background: ISSUE_COLORS[d.issue_type] ?? '#317a45' }} />
                <p className="truncate text-xs text-(--color-muted)">{formatIssueType(d.issue_type)}</p>
                <p className="mt-1 font-(family-name:--font-display) text-lg font-bold leading-none">{d.percent}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
