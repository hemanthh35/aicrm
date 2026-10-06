import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { api, type Category, type Deal, type Product } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { ProductCard } from '@/components/ProductCard'
import { Pagination, paginate } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

export default function AgriShop() {
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
    api.get<Category[]>('/categories', { params: { domain: 'agriculture' } }).then((r) => setCategories(r.data))
    api.get<Deal[]>('/deals', { params: { active_only: true, domain: 'agriculture' } }).then((r) => setDeals(r.data)).catch(() => {})
    api.get(`/wishlist/${user!.id}`, { params: { domain: domain ?? 'agriculture' } }).then((r) => setWishlistIds(new Set(r.data.map((w: any) => w.product.id))))
  }, [domain, user])

  useEffect(() => {
    api
      .get<Product[]>('/products', { params: { domain: 'agriculture', category_id: activeCat || undefined, search: search || undefined } })
      .then((r) => setProducts(r.data))
    setPage(1)
  }, [activeCat, search])

  const addToCart = (p: Product) =>
    api.post('/cart', { customer_id: user!.id, product_id: p.id, quantity: 1, domain: domain ?? 'agriculture' })
      .then(() => toast(`${p.name} added to cart`))
      .catch(() => toast('Could not add to cart', 'error'))
  const toggleWishlist = (p: Product) =>
    api.post('/wishlist', { customer_id: user!.id, product_id: p.id, domain: domain ?? 'agriculture' })
      .then(() => {
        setWishlistIds((prev) => new Set(prev).add(p.id))
        toast(`${p.name} added to wishlist`)
      })
      .catch(() => toast('Could not add to wishlist', 'error'))

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <h1 className="font-(family-name:--font-display) text-xl font-bold">Shop</h1>
      <Input
        placeholder="Search seeds, fertilizers, tools..."
        value={search}
        onChange={(e) => {
          const next = new URLSearchParams(params)
          if (e.target.value) next.set('search', e.target.value)
          else next.delete('search')
          setParams(next)
        }}
        className="focus:ring-2 focus:ring-(--color-agri-primary)/30"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setParams({})}
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border',
            !activeCat ? 'bg-(--color-agri-primary) border-(--color-agri-primary) text-white' : 'border-(--color-border) text-(--color-muted)'
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParams({ cat: String(c.id) })}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border',
              activeCat === String(c.id) ? 'bg-(--color-agri-primary) border-(--color-agri-primary) text-white' : 'border-(--color-border) text-(--color-muted)'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      {products.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-(--color-surface) px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-agri-primary)/10 text-(--color-agri-primary)">
            <ShoppingBag size={24} />
          </span>
          <p className="text-sm text-(--color-muted)">No products found. Try a different search or category.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 lg:gap-6">
        {pageItems.map((p) => (
          <ProductCard key={p.id} product={p} deal={deals.find((deal) => deal.product.id === p.id)} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wished={wishlistIds.has(p.id)} />
        ))}
      </div>
      {products.length > 0 && (
        <div className="pb-4">
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={products.length} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  )
}
