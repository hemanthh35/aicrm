import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type WishlistItem, type Product } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { ProductCard } from '@/components/ProductCard'
import { Pagination, paginate } from '@/components/ui/pagination'

const PAGE_SIZE = 12

export default function Wishlist() {
  const { t } = useTranslation()
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [page, setPage] = useState(1)
  const { pageItems, pageCount, clampedPage } = paginate(items, PAGE_SIZE, page)

  const load = () => api.get<WishlistItem[]>(`/wishlist/${user!.id}`, { params: { domain } }).then((r) => setItems(r.data))
  useEffect(() => { if (user) load() }, [domain, user])

  const addToCart = (p: Product) =>
    api.post('/cart', { customer_id: user!.id, product_id: p.id, quantity: 1, domain: domain ?? 'ecommerce' })
      .then(() => toast(t('common.addedToCart', { name: p.name })))
      .catch(() => toast(t('common.couldNotAddToCart'), 'error'))

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">{t('wishlist.title')}</h1>
      {items.length === 0 ? (
        <div className="card-lift flex flex-col items-center rounded-3xl bg-(--color-surface) px-6 py-24 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-(--color-danger)/10 text-(--color-danger)">
            <Heart size={32} />
          </span>
          <p className="mt-6 max-w-sm text-sm leading-6 text-(--color-muted)">{t('wishlist.emptyText')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
          {pageItems.map((item) => (
            <ProductCard key={item.id} product={item.product} onAddToCart={addToCart} wished />
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="pb-6">
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={items.length} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  )
}
