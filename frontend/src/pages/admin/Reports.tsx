import { useEffect, useState } from 'react'
import { FileDown, ShoppingBag, Users, IndianRupee, Package, AlertTriangle, Trophy } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  api, type DashboardStats, type CategoryShare, type SalesPoint,
  type OrderStatusBreakdown, type TopProduct, type LowStockProduct,
} from '@/lib/api'
import { formatINR } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  delivered: '#22C55E', processing: '#4F6BFF', shipped: '#F59E0B', pending: '#9AA1A9', cancelled: '#EF4444',
}
const CATEGORY_COLORS = ['#4F6BFF', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

const tooltipStyle = { background: '#15181C', border: '1px solid #262A2F', borderRadius: 12, fontSize: 12 }

export default function AdminReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categories, setCategories] = useState<CategoryShare[]>([])
  const [sales, setSales] = useState<SalesPoint[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])

  useEffect(() => {
    api.get('/admin/analytics/dashboard').then((r) => setStats(r.data))
    api.get('/admin/analytics/top-categories').then((r) => setCategories(r.data))
    api.get('/admin/analytics/sales-overview').then((r) => setSales(r.data))
    api.get('/admin/analytics/order-status-breakdown').then((r) => setStatusBreakdown(r.data))
    api.get('/admin/analytics/top-products', { params: { limit: 6 } }).then((r) => setTopProducts(r.data))
    api.get('/admin/analytics/low-stock').then((r) => setLowStock(r.data))
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Orders', String(stats?.total_orders ?? 0)],
      ['Total Customers', String(stats?.total_customers ?? 0)],
      ['Total Revenue', String(stats?.total_revenue ?? 0)],
      ['Total Products', String(stats?.total_products ?? 0)],
      [],
      ['Revenue by Day', ''],
      ...sales.map((s) => [s.label, String(s.value)]),
      [],
      ['Order Status', 'Count', 'Percent'],
      ...statusBreakdown.map((s) => [s.status, String(s.count), `${s.percent}%`]),
      [],
      ['Top Products', 'Orders', 'Price'],
      ...topProducts.map((p) => [p.name, String(p.order_count), String(p.price)]),
      [],
      ['Category Share', 'Percent'],
      ...categories.map((c) => [c.name, `${c.percent}%`]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `techkart-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Sales, customers, products, and revenue insights"
        actions={<Button onClick={exportCSV}><FileDown size={16} /> Export CSV</Button>}
      />
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Revenue" value={stats ? formatINR(stats.total_revenue) : '—'} growthPct={stats?.revenue_growth_pct} icon={IndianRupee} />
          <StatCard label="Total Orders" value={stats ? String(stats.total_orders) : '—'} growthPct={stats?.orders_growth_pct} icon={ShoppingBag} />
          <StatCard label="Total Customers" value={stats ? String(stats.total_customers) : '—'} growthPct={stats?.customers_growth_pct} icon={Users} />
          <StatCard label="Total Products" value={stats ? String(stats.total_products) : '—'} growthPct={stats?.products_growth_pct} icon={Package} />
        </div>

        <Card>
          <CardHeader><CardTitle>Revenue Trend (Last 7 Days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F6BFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4F6BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#262A2F" />
                <XAxis dataKey="label" stroke="#9AA1A9" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9AA1A9" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} />
                <Area type="monotone" dataKey="value" stroke="#4F6BFF" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
            <CardContent className="flex h-56 items-center gap-4">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {statusBreakdown.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 text-xs">
                {statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                    <span className="min-w-20 capitalize text-(--color-muted)">{s.status}</span>
                    <span className="font-semibold">{s.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Category Share</CardTitle></CardHeader>
            <CardContent className="flex h-56 items-center gap-4">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="percent" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {categories.map((c, i) => <Cell key={c.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 overflow-y-auto text-xs">
                {categories.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="min-w-16 truncate text-(--color-muted)">{c.name}</span>
                    <span className="font-semibold">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle size={16} className="text-(--color-warning)" /> Low Stock</CardTitle></CardHeader>
            <CardContent className="flex h-56 flex-col gap-3 overflow-y-auto">
              {lowStock.length === 0 && <p className="text-sm text-(--color-muted)">All products well stocked.</p>}
              {lowStock.map((p) => (
                <div key={p.product_id} className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <span className="flex-shrink-0 text-xs font-semibold text-(--color-danger)">{p.stock} left</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy size={16} className="text-(--color-warning)" /> Top Selling Products</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} stroke="#262A2F" />
                <XAxis type="number" stroke="#9AA1A9" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#9AA1A9" fontSize={11} tickLine={false} axisLine={false} width={140} tick={{ width: 130 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} orders`, 'Sold']} />
                <Bar dataKey="order_count" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
