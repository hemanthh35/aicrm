import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Sprout, ShoppingBag, Headset as HeadsetIcon, MapPin } from 'lucide-react'
import { api, type Crop, type Deal, type Product } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { ProductCard } from '@/components/ProductCard'

export default function AgriHome() {
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [featured, setFeatured] = useState<Product[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get<Product[]>('/products', { params: { domain: 'agriculture', featured: true } }).then((r) => setFeatured(r.data))
    api.get<Crop[]>('/crops', { params: { customer_id: user!.id } }).then((r) => setCrops(r.data))
    api.get<Deal[]>('/deals', { params: { active_only: true, domain: 'agriculture' } }).then((r) => setDeals(r.data)).catch(() => {})
    api.get(`/wishlist/${user!.id}`, { params: { domain: domain ?? 'agriculture' } }).then((r) => setWishlistIds(new Set(r.data.map((w: any) => w.product.id))))
  }, [domain, user])

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
    <div className="flex flex-col gap-7 px-4 pt-6">
      <div>
        <p className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">
          Namaskaram, {user?.name?.split(' ')[0]}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-(--color-muted)">
          <MapPin size={12} /> {user?.city ?? 'India'}
        </p>
      </div>

      <button
        onClick={() => navigate('/assistant')}
        className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5 text-left"
      >
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--color-agri-primary) to-(--color-agri-glow)">
          <Mic size={19} className="text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Speak your requirement</p>
          <p className="text-xs text-(--color-muted)">Ask about crops, products, or orders</p>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-5 md:gap-6">
        <Link to="/agriculture/crops" className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-agri-primary)/12 text-(--color-agri-primary)">
            <Sprout size={19} />
          </span>
          <span>
            <p className="text-sm font-semibold">My Crops</p>
            <p className="text-[11px] text-(--color-muted)">{crops.length} active</p>
          </span>
        </Link>
        <Link to="/agriculture/shop" className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-agri-primary)/12 text-(--color-agri-primary)">
            <ShoppingBag size={19} />
          </span>
          <span>
            <p className="text-sm font-semibold">Products</p>
            <p className="text-[11px] text-(--color-muted)">Seeds, tools &amp; more</p>
          </span>
        </Link>
      </div>

      <Link to="/support" className="card-lift flex items-center gap-3 rounded-3xl bg-(--color-surface) p-5">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-agri-primary)/12 text-(--color-agri-primary)">
          <HeadsetIcon size={19} />
        </span>
        <span>
          <p className="text-sm font-semibold">Talk to an Expert</p>
          <p className="text-[11px] text-(--color-muted)">Get advice from agriculture experts</p>
        </span>
      </Link>

      {deals.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div><p className="eyebrow text-(--color-agri-primary)">Limited-time offers</p><h2 className="mt-1 font-(family-name:--font-display) text-lg font-bold">Better value for your next harvest</h2></div>
            <Link to="/agriculture/shop" className="text-xs font-semibold text-(--color-agri-primary)">View All</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
            {[...deals].sort((a, b) => b.discount_percent - a.discount_percent).slice(0, 4).map((deal) => <ProductCard key={deal.id} product={deal.product} deal={deal} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wished={wishlistIds.has(deal.product.id)} />)}
          </div>
        </section>
      )}

      <section className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-(family-name:--font-display) text-lg font-bold">Recommended Products</h2>
          <Link to="/agriculture/shop" className="text-xs font-semibold text-(--color-agri-primary)">View All</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 lg:gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wished={wishlistIds.has(p.id)} />
          ))}
        </div>
      </section>
    </div>
  )
}
