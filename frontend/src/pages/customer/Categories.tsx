import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, type Category, type Deal, type Product } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { ProductCard } from '@/components/ProductCard'
import { Pagination, paginate } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

export default function Categories() {
  const { t } = useTranslation()
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const activeCat = params.get('cat')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const search = params.get('search') ?? ''
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const { pageItems, pageCount, clampedPage } = paginate(products, PAGE_SIZE, page)

  useEffect(() => {
    api.get<Category[]>('/categories', { params: { domain: 'ecommerce' } }).then((r) => setCategories(r.data))
    api.get<Deal[]>('/deals', { params: { active_only: true, domain: 'ecommerce' } }).then((r) => setDeals(r.data)).catch(() => {})
    api.get(`/wishlist/${user!.id}`, { params: { domain: domain ?? 'ecommerce' } }).then((r) => setWishlistIds(new Set(r.data.map((w: any) => w.product.id))))
  }, [domain, user])

  useEffect(() => {
    api
      .get<Product[]>('/products', { params: { domain: 'ecommerce', category_id: activeCat || undefined, search: search || undefined } })
      .then((r) => setProducts(r.data))
    setPage(1)
  }, [activeCat, search])

  const addToCart = (p: Product) =>
    api.post('/cart', { customer_id: user!.id, product_id: p.id, quantity: 1, domain: domain ?? 'ecommerce' })
      .then(() => toast(t('common.addedToCart', { name: p.name })))
      .catch(() => toast(t('common.couldNotAddToCart'), 'error'))
  const toggleWishlist = (p: Product) =>
    api.post('/wishlist', { customer_id: user!.id, product_id: p.id, domain: domain ?? 'ecommerce' })
      .then(() => {
        setWishlistIds((prev) => new Set(prev).add(p.id))
        toast(t('common.addedToWishlist', { name: p.name }))
      })
      .catch(() => toast(t('common.couldNotAddToWishlist'), 'error'))

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">{t('categories.title')}</h1>
      <input
        placeholder={t('categories.searchPlaceholder')}
        value={search}
        onChange={(e) => {
          const next = new URLSearchParams(params)
          if (e.target.value) next.set('search', e.target.value)
          else next.delete('search')
          setParams(next)
        }}
        className="h-12 rounded-full bg-(--color-surface) px-5 text-sm outline-none card-lift placeholder:text-(--color-muted) focus:ring-2 focus:ring-(--color-ecom-primary)/30"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setParams({})}
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors',
            !activeCat ? 'bg-(--color-ecom-primary) text-white' : 'bg-(--color-surface) text-(--color-muted) hover:text-(--color-text)'
          )}
        >
          {t('categories.all')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParams({ cat: String(c.id) })}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors',
              activeCat === String(c.id) ? 'bg-(--color-ecom-primary) text-white' : 'bg-(--color-surface) text-(--color-muted) hover:text-(--color-text)'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
        {pageItems.map((p) => (
          <ProductCard key={p.id} product={p} deal={deals.find((deal) => deal.product.id === p.id)} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wished={wishlistIds.has(p.id)} />
        ))}
      </div>
      {products.length > 0 && (
        <div className="pb-6">
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={products.length} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  )
}
