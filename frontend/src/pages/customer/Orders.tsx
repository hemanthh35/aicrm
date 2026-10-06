import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Headset,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, type Order } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/FallbackImage'
import { Pagination, paginate } from '@/components/ui/pagination'
import { formatINR } from '@/lib/utils'

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

function getStatusSteps(t: (key: string) => string) {
  return [
    { key: 'pending', label: t('orders.statusPlaced'), icon: Clock3 },
    { key: 'processing', label: t('orders.statusPacking'), icon: Package },
    { key: 'shipped', label: t('orders.statusOnTheWay'), icon: Truck },
    { key: 'delivered', label: t('orders.statusDelivered'), icon: PackageCheck },
  ]
}

function getStatusCopy(t: (key: string) => string): Record<string, { label: string; description: string; variant: 'default' | 'warning' | 'ecom' | 'success' | 'danger' }> {
  return {
    pending: { label: t('orders.copyPlacedLabel'), description: t('orders.copyPlacedDesc'), variant: 'default' },
    processing: { label: t('orders.copyProcessingLabel'), description: t('orders.copyProcessingDesc'), variant: 'warning' },
    shipped: { label: t('orders.copyShippedLabel'), description: t('orders.copyShippedDesc'), variant: 'ecom' },
    delivered: { label: t('orders.copyDeliveredLabel'), description: t('orders.copyDeliveredDesc'), variant: 'success' },
    cancelled: { label: t('orders.copyCancelledLabel'), description: t('orders.copyCancelledDesc'), variant: 'danger' },
  }
}

const PAGE_SIZE = 6

function orderNumber(id: number) {
  return `#TK${10000 + id}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isActive(order: Order) {
  return !['delivered', 'cancelled'].includes(order.status)
}

function statusIndex(steps: { key: string }[], status: string) {
  return steps.findIndex((step) => step.key === status)
}

export default function Orders() {
  const { t } = useTranslation()
  const STATUS_STEPS = getStatusSteps(t)
  const STATUS_COPY = getStatusCopy(t)
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const browsePath = domain === 'agriculture' ? '/agriculture/shop' : '/ecommerce/categories'
  const isAgri = domain === 'agriculture'
  const accentText = isAgri ? 'text-(--color-agri-primary)' : 'text-(--color-ecom-primary)'
  const accentSoft = isAgri ? 'bg-(--color-agri-primary)/12' : 'bg-(--color-ecom-primary)/12'
  const accentButton = isAgri ? 'agri' : 'primary'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [reorderingId, setReorderingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.get<Order[]>('/orders', { params: { customer_id: user.id, domain } })
      .then((r) => setOrders(r.data))
      .catch(() => toast(t('orders.couldNotLoad'), 'error'))
      .finally(() => setLoading(false))
  }, [domain, toast, user])

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesFilter = filter === 'all'
        || (filter === 'active' && isActive(order))
        || (filter === 'delivered' && order.status === 'delivered')
        || (filter === 'cancelled' && order.status === 'cancelled')
      const matchesSearch = !normalized
        || orderNumber(order.id).toLowerCase().includes(normalized)
        || order.items.some((item) => item.product.name.toLowerCase().includes(normalized))
      return matchesFilter && matchesSearch
    })
  }, [filter, orders, query])

  const { pageItems, pageCount, clampedPage } = paginate(filteredOrders, PAGE_SIZE, page)
  const activeCount = orders.filter(isActive).length
  const deliveredCount = orders.filter((order) => order.status === 'delivered').length
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0)

  const changeFilter = (nextFilter: OrderFilter) => {
    setFilter(nextFilter)
    setPage(1)
  }

  const handleReorder = async (order: Order) => {
    if (!user || !order.items.length) return
    setReorderingId(order.id)
    try {
      await Promise.all(order.items.map((item) => api.post('/cart', {
        customer_id: user.id,
        product_id: item.product.id,
        quantity: item.quantity,
        domain,
      })))
      toast(t('orders.reorderAdded'))
    } catch {
      toast(t('orders.reorderFailed'), 'error')
    } finally {
      setReorderingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-5 md:px-0 md:pt-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-(--color-muted)">
            <Link to={domain === 'agriculture' ? '/agriculture' : '/ecommerce'} className="transition-colors hover:text-(--color-text)">{t('common.home')}</Link>
            <span>/</span>
            <span className="text-(--color-text)">{t('orders.breadcrumbOrders')}</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight sm:text-3xl">{t('orders.title')}</h1>
          <p className="mt-1 text-sm text-(--color-muted)">{t('orders.subtitle')}</p>
        </div>
        <Link to={browsePath} className={`inline-flex items-center gap-2 text-sm font-semibold ${accentText}`}>
          {t('cart.continueShopping')} <ArrowRight size={15} />
        </Link>
      </div>

      {!loading && orders.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card-lift min-h-24 rounded-3xl bg-(--color-surface) p-5">
            <div className="flex h-full items-center gap-3"><span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${accentSoft} ${accentText}`}><Package size={17} /></span><div><p className="text-xs text-(--color-muted)">{t('orders.totalOrders')}</p><p className="mt-1 font-(family-name:--font-display) text-xl font-bold leading-none">{orders.length}</p></div></div>
          </div>
          <div className="card-lift min-h-24 rounded-3xl bg-(--color-surface) p-5">
            <div className="flex h-full items-center gap-3"><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-warning)/12 text-(--color-warning)"><Truck size={17} /></span><div><p className="text-xs text-(--color-muted)">{t('orders.onTheWay')}</p><p className="mt-1 font-(family-name:--font-display) text-xl font-bold leading-none">{activeCount}</p></div></div>
          </div>
          <div className="card-lift min-h-24 rounded-3xl bg-(--color-surface) p-5">
            <div className="flex h-full items-center gap-3"><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-success)/12 text-(--color-success)"><Check size={17} /></span><div className="min-w-0"><p className="text-xs text-(--color-muted)">{t('orders.delivered')}</p><div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><span className="font-(family-name:--font-display) text-xl font-bold leading-none">{deliveredCount}</span><span className="text-[11px] leading-4 text-(--color-muted)">{t('orders.spent', { amount: formatINR(totalSpent) })}</span></div></div></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-lift rounded-3xl bg-(--color-surface) p-10 text-center text-sm text-(--color-muted)">{t('orders.loadingOrders')}</div>
      ) : orders.length === 0 ? (
        <div className="card-lift overflow-hidden rounded-3xl bg-(--color-surface)">
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <span className={`flex h-20 w-20 items-center justify-center rounded-full ${accentSoft} ${accentText}`}><ShoppingBag size={34} /></span>
            <h2 className="mt-5 font-(family-name:--font-display) text-xl font-bold">{t('orders.emptyTitle')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-(--color-muted)">{t('orders.emptyDesc')}</p>
            <Link to={browsePath} className="mt-6"><Button variant={accentButton} size="lg">{t('cart.startShopping')} <ArrowRight size={17} /></Button></Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card-lift mb-5 flex flex-col gap-3 rounded-3xl bg-(--color-surface) p-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 flex-wrap gap-1">
              {([
                ['all', t('orders.allOrders', { count: orders.length })],
                ['active', t('orders.active', { count: activeCount })],
                ['delivered', t('orders.deliveredFilter', { count: deliveredCount })],
                ['cancelled', t('orders.cancelled', { count: orders.filter((order) => order.status === 'cancelled').length })],
              ] as [OrderFilter, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => changeFilter(value)} className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${filter === value ? `${accentSoft} ${accentText}` : 'text-(--color-muted) hover:bg-black/5 hover:text-(--color-text)'}`}>
                  {label}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 w-full min-w-0 flex-shrink-0 items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface-2) px-3 py-2 transition-colors focus-within:border-(--color-ecom-primary)/45 focus-within:ring-4 focus-within:ring-(--color-accent-lime)/20 sm:w-[18rem]">
              <Search size={16} className="flex-shrink-0 text-(--color-muted)" />
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={t('orders.searchPlaceholder')} aria-label={t('orders.searchPlaceholder')} className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-7 outline-none placeholder:text-(--color-muted) focus:ring-0" />
            </label>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="card-lift rounded-3xl bg-(--color-surface) px-6 py-14 text-center">
              <Search size={28} className="mx-auto text-(--color-muted)" />
              <h2 className="mt-4 font-(family-name:--font-display) font-bold">{t('orders.noMatching')}</h2>
              <p className="mt-1 text-sm text-(--color-muted)">{t('orders.tryAnother')}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setQuery(''); changeFilter('all') }}>{t('orders.clearFilters')}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pageItems.map((order) => {
                const status = STATUS_COPY[order.status] ?? STATUS_COPY.pending
                const currentStep = statusIndex(STATUS_STEPS, order.status)
                const isExpanded = expandedId === order.id
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <article key={order.id} className="card-lift overflow-hidden rounded-3xl bg-(--color-surface)">
                    <div className="flex flex-col gap-3 border-b border-(--color-border) px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentSoft} ${accentText}`}><Package size={18} /></span>
                        <div><p className="font-semibold">{t('orders.order', { number: orderNumber(order.id) })}</p><p className="mt-0.5 text-xs text-(--color-muted)">{formatDate(order.created_at)} · {t('orders.itemCount', { count: itemCount })}</p></div>
                      </div>
                      <Badge variant={isAgri && order.status === 'shipped' ? 'agri' : status.variant}>{status.label}</Badge>
                    </div>

                    <div className="px-5 py-5 sm:px-6">
                      <div className="flex gap-4">
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-(--color-surface-2) sm:h-24 sm:w-24">
                          {order.items[0] ? <FallbackImage src={order.items[0].product.image_url} alt={order.items[0].product.name} letter={order.items[0].product.name.slice(0, 1)} /> : <Package size={24} className="text-(--color-muted)" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-semibold" data-no-ui-translate>{order.items[0]?.product.name ?? t('orders.itemsInOrder')}</p>
                          {order.items.length > 1 && <p className="mt-1 text-xs text-(--color-muted)">{t('orders.moreProducts', { count: order.items.length - 1 })}</p>}
                          <p className="mt-2 text-sm text-(--color-muted)">{status.description}</p>
                          <p className="mt-2 font-(family-name:--font-display) text-lg font-bold">{formatINR(order.total_amount)}</p>
                        </div>
                      </div>

                      {order.status === 'cancelled' ? (
                        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-(--color-danger)/8 px-4 py-3 text-xs text-(--color-danger)"><XCircle size={16} /> {t('orders.cancelledNotice')}</div>
                      ) : (
                        <div className="mt-6 rounded-2xl bg-(--color-surface-2) px-3 py-4 sm:px-5">
                          <div className="flex items-start justify-between gap-1">
                            {STATUS_STEPS.map((step, index) => {
                              const complete = currentStep >= index
                              const StepIcon = step.icon
                              return (
                                <div key={step.key} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                                  {index < STATUS_STEPS.length - 1 && <span className={`absolute left-1/2 top-3 h-px w-full ${currentStep > index ? (isAgri ? 'bg-(--color-agri-primary)' : 'bg-(--color-ecom-primary)') : 'bg-(--color-border)'}`} />}
                                  <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${complete ? `${accentSoft} ${accentText}` : 'bg-(--color-border) text-(--color-muted)'}`}><StepIcon size={12} /></span>
                                  <span className={`text-[10px] leading-3 sm:text-xs ${complete ? 'font-semibold text-(--color-text)' : 'text-(--color-muted)'}`}>{step.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-(--color-border) pt-4">
                        <Button variant="secondary" size="sm" onClick={() => setExpandedId(isExpanded ? null : order.id)}>{isExpanded ? t('orders.hideDetails') : t('orders.viewDetails')}{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Button>
                        {order.status === 'delivered' && <Button variant="outline" size="sm" onClick={() => handleReorder(order)} disabled={reorderingId === order.id}><RefreshCw size={14} className={reorderingId === order.id ? 'animate-spin' : ''} /> {reorderingId === order.id ? t('orders.adding') : t('orders.buyAgain')}</Button>}
                        <Link to="/support" className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-muted) transition-colors hover:text-(--color-text)"><Headset size={14} /> {t('orders.needHelp')}</Link>
                      </div>

                      {isExpanded && (
                        <div className="mt-5 grid gap-4 border-t border-(--color-border) pt-5 md:grid-cols-[minmax(0,1fr)_240px]">
                          <div>
                            <h3 className="mb-3 text-sm font-bold">{t('orders.itemsInOrder')}</h3>
                            <div className="flex flex-col gap-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-(--color-surface-2) p-3">
                                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-(--color-bg)"><FallbackImage src={item.product.image_url} alt={item.product.name} letter={item.product.name.slice(0, 1)} /></div>
                                  <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold" data-no-ui-translate>{item.product.name}</p><p className="mt-1 text-xs text-(--color-muted)">{t('orders.qtyEach', { qty: item.quantity, price: formatINR(item.unit_price) })}</p></div>
                                  <p className="text-sm font-bold">{formatINR(item.unit_price * item.quantity)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="rounded-2xl bg-(--color-surface-2) p-4"><div className="flex items-center gap-2 text-xs font-semibold"><MapPin size={14} className={accentText} /> {t('orders.deliveryAddress')}</div><p className="mt-2 text-xs leading-5 text-(--color-muted)">{order.shipping_address || t('orders.addressFallback')}</p></div>
                            <div className="rounded-2xl bg-(--color-surface-2) p-4"><p className="text-xs font-semibold">{t('orders.payment')}</p><p className="mt-2 text-xs capitalize text-(--color-muted)">{order.payment_method || t('orders.paymentFallback')}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {filteredOrders.length > 0 && <div className="mt-6"><Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={filteredOrders.length} pageSize={PAGE_SIZE} /></div>}
        </>
      )}
    </div>
  )
}
