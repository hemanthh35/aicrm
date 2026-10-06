import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, type CartItem } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/FallbackImage'
import { formatINR, getEffectivePrice } from '@/lib/utils'

export default function Cart() {
  const { t } = useTranslation()
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const browsePath = domain === 'agriculture' ? '/agriculture/shop' : '/ecommerce/categories'
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<CartItem[]>(`/cart/${user!.id}`, { params: { domain } })
      .then((r) => setItems(r.data))
      .catch(() => toast(t('cart.couldNotLoad'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [domain, user])

  const updateQty = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return
    setUpdatingId(item.id)
    try {
      await api.put(`/cart/${item.id}`, { quantity })
      await load()
    } catch {
      toast(t('cart.couldNotUpdateQty'), 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const remove = (item: CartItem) => {
    api.delete(`/cart/${item.id}`)
      .then(() => { load(); toast(t('cart.removedFromCart'), 'info') })
      .catch(() => toast(t('cart.couldNotRemove'), 'error'))
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + getEffectivePrice(item.product) * item.quantity, 0)
  const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 49
  const total = subtotal + delivery

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 md:px-0 md:pt-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-(--color-muted)">
            <Link to={domain === 'agriculture' ? '/agriculture' : '/ecommerce'} className="transition-colors hover:text-(--color-text)">{t('common.home')}</Link>
            <span>/</span>
            <span className="text-(--color-text)">{t('cart.breadcrumbCart')}</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight sm:text-3xl">{t('cart.title')}</h1>
          <p className="mt-1 text-sm text-(--color-muted)">{itemCount ? t('cart.itemsReady', { count: itemCount }) : t('cart.emptyWaiting')}</p>
        </div>
        {items.length > 0 && (
          <div className="card-lift flex items-center gap-2 rounded-full bg-(--color-surface) px-4 py-2.5 text-xs text-(--color-muted)">
            <LockKeyhole size={13} className="text-(--color-success)" /> {t('cart.secureCheckout')}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card-lift rounded-3xl bg-(--color-surface) p-10 text-center text-sm text-(--color-muted)">{t('cart.loadingCart')}</div>
      ) : items.length === 0 ? (
        <div className="card-lift overflow-hidden rounded-3xl bg-(--color-surface)">
          <div className="flex flex-col items-center px-6 py-24 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-ecom-primary)/10 text-(--color-ecom-primary)">
              <ShoppingBag size={32} />
            </span>
            <h2 className="mt-6 font-(family-name:--font-display) text-xl font-bold">{t('cart.emptyTitle')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-(--color-muted)">{t('cart.emptyDesc')}</p>
            <Link to={browsePath} className="mt-7">
              <Button size="lg">{t('cart.startShopping')} <ArrowRight size={17} /></Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex flex-col gap-6">
            <section className="card-lift overflow-hidden rounded-3xl bg-(--color-surface)">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <h2 className="font-(family-name:--font-display) font-bold">{t('cart.yourItems')}</h2>
                  <p className="mt-0.5 text-xs text-(--color-muted)">{t('cart.reviewItems')}</p>
                </div>
                <span className="rounded-full bg-(--color-ecom-primary)/10 px-2.5 py-1 text-xs font-semibold text-(--color-ecom-primary)">{t('cart.itemsCount', { count: itemCount })}</span>
              </div>

              <div className="divide-y divide-(--color-border)">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 px-6 py-5">
                    <Link to={`/product/${item.product.id}`} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl bg-(--color-surface-2) sm:h-28 sm:w-28">
                      <FallbackImage src={item.product.image_url} alt={item.product.name} letter={item.product.name.slice(0, 1)} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/product/${item.product.id}`} className="line-clamp-2 text-sm font-semibold transition-colors hover:text-(--color-ecom-primary) sm:text-base" data-no-ui-translate>{item.product.name}</Link>
                          <p className="mt-1 text-xs text-(--color-muted)">{t('cart.inStockBrand', { brand: item.product.brand || 'TechKart' })}</p>
                        </div>
                        <button type="button" onClick={() => remove(item)} aria-label={t('cart.removeAria', { name: item.product.name })} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-danger)/10 hover:text-(--color-danger)">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-base font-bold sm:text-lg">{formatINR(getEffectivePrice(item.product))}</p>
                          {item.product.active_deal && <p className="mt-0.5 text-[11px] font-semibold text-(--color-success)">{Math.round(item.product.active_deal.discount_percent)}% offer applied</p>}
                          <p className="mt-0.5 text-[11px] text-(--color-success)">{t('cart.freeReturns')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-(--color-muted)">{t('cart.qty')}</span>
                          <div className="flex h-9 items-center rounded-full border border-(--color-border) bg-(--color-surface)">
                            <button type="button" onClick={() => updateQty(item, item.quantity - 1)} disabled={updatingId === item.id || item.quantity === 1} aria-label={t('cart.decreaseQty')} className="flex h-full w-9 items-center justify-center text-(--color-muted) transition-colors hover:text-(--color-text) disabled:opacity-40"><Minus size={14} /></button>
                            <span className="w-7 text-center text-sm font-semibold">{updatingId === item.id ? '…' : item.quantity}</span>
                            <button type="button" onClick={() => updateQty(item, item.quantity + 1)} disabled={updatingId === item.id} aria-label={t('cart.increaseQty')} className="flex h-full w-9 items-center justify-center text-(--color-muted) transition-colors hover:text-(--color-text) disabled:opacity-40"><Plus size={14} /></button>
                          </div>
                          <p className="hidden min-w-20 text-right text-sm font-bold sm:block">{formatINR(getEffectivePrice(item.product) * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
                <Truck size={18} className="flex-shrink-0 text-(--color-ecom-primary)" />
                <div><p className="text-xs font-semibold">{t('cart.fastDelivery')}</p><p className="mt-0.5 text-[10px] text-(--color-muted)">{t('cart.trackEveryOrder')}</p></div>
              </div>
              <div className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
                <BadgeCheck size={18} className="flex-shrink-0 text-(--color-success)" />
                <div><p className="text-xs font-semibold">{t('cart.qualityChecked')}</p><p className="mt-0.5 text-[10px] text-(--color-muted)">{t('cart.productsYouTrust')}</p></div>
              </div>
              <div className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
                <LockKeyhole size={18} className="flex-shrink-0 text-(--color-ecom-primary)" />
                <div><p className="text-xs font-semibold">{t('cart.safePayments')}</p><p className="mt-0.5 text-[10px] text-(--color-muted)">{t('cart.protectedCheckout')}</p></div>
              </div>
            </div>

            <Link to={browsePath} className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-ecom-primary) transition-colors hover:text-(--color-ecom-primary-hover)">
              <ArrowLeft size={16} /> {t('cart.continueShopping')}
            </Link>
          </div>

          <aside className="lg:sticky lg:top-24">
            <section className="card-lift overflow-hidden rounded-3xl bg-(--color-surface)">
              <div className="px-6 py-5">
                <h2 className="font-(family-name:--font-display) font-bold">{t('cart.orderSummary')}</h2>
                <p className="mt-0.5 text-xs text-(--color-muted)">{t('cart.taxesIncluded')}</p>
              </div>
              <div className="flex flex-col gap-3 px-6 pb-6">
                <div className="flex justify-between text-sm"><span className="text-(--color-muted)">{t('cart.subtotal')}</span><span>{formatINR(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-(--color-muted)">{t('cart.delivery')}</span><span className={delivery === 0 ? 'text-(--color-success)' : ''}>{delivery === 0 ? t('cart.free') : formatINR(delivery)}</span></div>
                {delivery > 0 && <p className="rounded-2xl bg-(--color-ecom-primary)/8 px-3 py-2 text-[11px] leading-4 text-(--color-muted)">{t('cart.addMoreForFree', { amount: formatINR(999 - subtotal) })}</p>}
                <div className="my-1 h-px w-full bg-(--color-border)" />
                <div className="flex items-end justify-between"><span className="text-sm font-semibold">{t('cart.total')}</span><span className="font-(family-name:--font-display) text-2xl font-bold">{formatINR(total)}</span></div>
                <Button size="lg" className="mt-2 w-full" onClick={() => navigate('/checkout')}>{t('cart.proceedToCheckout')} <ArrowRight size={17} /></Button>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-(--color-muted)"><LockKeyhole size={12} className="text-(--color-success)" /> {t('cart.secureEncrypted')}</p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
