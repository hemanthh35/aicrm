import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { api, type CartItem } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatINR, getEffectivePrice, cn } from '@/lib/utils'

export default function Checkout() {
  const { t } = useTranslation()
  const PAYMENT_METHODS = [
    { id: 'card', label: t('checkout.paymentCard') },
    { id: 'upi', label: t('checkout.paymentUpi') },
    { id: 'cod', label: t('checkout.paymentCod') },
  ]
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState(`${user?.name ?? ''}, ${user?.city ?? ''}`)
  const [method, setMethod] = useState('card')
  const [placed, setPlaced] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => { if (user) api.get<CartItem[]>(`/cart/${user.id}`, { params: { domain } }).then((r) => setItems(r.data)) }, [domain, user])

  const subtotal = items.reduce((sum, i) => sum + getEffectivePrice(i.product) * i.quantity, 0)

  const placeOrder = async () => {
    try {
      const { data } = await api.post('/orders', {
        customer_id: user!.id,
        shipping_address: address,
        payment_method: method,
        domain,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      })
      setPlaced(data.id)
      toast(t('checkout.orderPlacedToast'))
    } catch (err: any) {
      toast(err?.response?.data?.detail ?? t('checkout.couldNotPlaceOrder'), 'error')
    }
  }

  if (placed) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-success)/10 text-(--color-success)">
          <CheckCircle2 size={40} />
        </span>
        <h1 className="font-(family-name:--font-display) text-2xl font-bold">{t('checkout.orderPlacedHeading')}</h1>
        <p className="text-sm text-(--color-muted)">{t('checkout.orderConfirmed', { id: 10000 + placed })}</p>
        <Button size="lg" className="mt-2" onClick={() => navigate('/orders')}>{t('checkout.trackOrder')}</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-10 md:px-0">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold">{t('checkout.title')}</h1>

      <div className="card-lift rounded-3xl bg-(--color-surface) p-6">
        <p className="mb-3 text-sm font-semibold">{t('checkout.shippingAddress')}</p>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="card-lift rounded-3xl bg-(--color-surface) p-6">
        <p className="mb-3 text-sm font-semibold">{t('checkout.paymentMethod')}</p>
        <div className="flex flex-col gap-2.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                'flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-medium transition-colors',
                method === m.id ? 'bg-(--color-ecom-primary)/8 text-(--color-ecom-primary)' : 'bg-(--color-surface-2) hover:bg-black/5'
              )}
            >
              {m.label}
              <span className={cn('h-4 w-4 rounded-full border-2', method === m.id ? 'border-(--color-ecom-primary) bg-(--color-ecom-primary)' : 'border-(--color-border)')} />
            </button>
          ))}
        </div>
      </div>

      <div className="card-lift rounded-3xl bg-(--color-surface) p-6">
        <p className="mb-3 text-sm font-semibold">{t('checkout.orderSummary')}</p>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between py-1.5 text-sm text-(--color-muted)">
            <span data-no-ui-translate>{i.product.name} × {i.quantity}</span>
            <span>{formatINR(getEffectivePrice(i.product) * i.quantity)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-(--color-border) pt-3 text-sm font-bold">
          <span>{t('checkout.total')}</span>
          <span>{formatINR(subtotal)}</span>
        </div>
      </div>

      <Button size="lg" disabled={items.length === 0} onClick={placeOrder}>{t('checkout.placeOrder')}</Button>
    </div>
  )
}
