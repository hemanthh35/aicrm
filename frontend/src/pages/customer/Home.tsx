import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ChevronRight, Headphones, Heart, Laptop, Mic, PackageCheck, ShieldCheck, Sparkles, Star, Smartphone, Watch, Wifi } from 'lucide-react'
import { api, type Category, type Deal, type Product } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { ProductCard } from '@/components/ProductCard'
import { formatINR } from '@/lib/utils'

const categoryIcons: Record<string, typeof Laptop> = { Laptops: Laptop, Mobiles: Smartphone, Headphones: Headphones, Smartwatches: Watch }
const fallbackProducts = [
  { name: 'AeroBook 14 Pro', brand: 'Northstar', price: 64990, category: 'Laptops', color: 'from-[#dbe7cf] to-[#f8f5e5]' },
  { name: 'Echo Buds Studio', brand: 'Morrow', price: 7990, category: 'Audio', color: 'from-[#dfe8dc] to-[#f1e9d7]' },
  { name: 'Fold Mini 5G', brand: 'Kite', price: 42990, category: 'Mobiles', color: 'from-[#e0e4d5] to-[#f5f2e1]' },
]

export default function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    api.get<Product[]>('/products', { params: { domain: 'ecommerce', featured: true } }).then((r) => setFeatured(r.data)).catch(() => {})
    api.get<Category[]>('/categories', { params: { domain: 'ecommerce' } }).then((r) => setCategories(r.data)).catch(() => {})
    api.get<Deal[]>('/deals', { params: { active_only: true, domain: 'ecommerce' } }).then((r) => setDeals(r.data)).catch(() => {})
  }, [])

  const addToCart = (product: Product) => {
    if (!user) return
    api.post('/cart', { customer_id: user.id, product_id: product.id, quantity: 1, domain: 'ecommerce' })
      .then(() => toast(t('common.addedToCart', { name: product.name })))
      .catch(() => toast(t('common.couldNotAddToCart'), 'error'))
  }

  return (
    <div className="animate-fade-up flex flex-col gap-8">
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-(--color-text) p-7 text-white sm:p-10 lg:p-12">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-(--color-accent-lime)/15 blur-3xl" />
          <div className="relative max-w-xl">
            <div className="eyebrow text-(--color-accent-lime)">{t('storeHome.greeting', { name: user?.name?.split(' ')[0] ?? t('home.guestName') })}</div>
            <h1 className="display-heading mt-5 text-5xl leading-[0.94] sm:text-6xl">{t('storeHome.heroTitle')}</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">{t('storeHome.heroCopy')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/ecommerce/categories"><button className="button-lime inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold">{t('storeHome.exploreCollection')} <ArrowUpRight size={16} /></button></Link>
              <Link to="/assistant" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"><Mic size={16} /> {t('storeHome.askPulse')}</Link>
            </div>
          </div>
        </div>

        <div className="soft-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div><div className="eyebrow">{t('storeHome.nextMoveEyebrow')}</div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">{t('storeHome.nextMoveTitle')}</h2></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Sparkles size={18} /></span>
          </div>
          <div className="mt-7 rounded-2xl bg-(--color-surface-2) p-4">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-text) text-(--color-accent-lime)"><Wifi size={16} /></span><div><p className="text-sm font-semibold">{t('storeHome.compareTitle')}</p><p className="mt-1 text-xs text-(--color-muted)">{t('storeHome.compareCopy')}</p></div></div>
            <button onClick={() => navigate('/assistant')} className="mt-5 flex w-full items-center justify-between rounded-xl bg-(--color-surface) px-4 py-3 text-left text-xs font-semibold"><span>{t('storeHome.samplePrompt')}</span><ArrowUpRight size={15} className="text-(--color-ecom-primary)" /></button>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-(--color-muted)"><span className="lime-dot" /> {t('storeHome.recommendationsReady')}</span><Link to="/assistant" className="font-semibold text-(--color-ecom-primary)">{t('storeHome.openAssistant')}</Link></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t('storeHome.curatedForYou')} value="24" note={t('storeHome.freshPicks')} icon={Sparkles} />
        <StatTile label={t('storeHome.fastShipping')} value="2-4 days" note={t('storeHome.onMostOrders')} icon={PackageCheck} />
        <StatTile label={t('storeHome.humanSupport')} value="24/7" note={t('storeHome.whenNeedIt')} icon={Headphones} />
      </section>

      <section>
        <SectionHeading eyebrow={t('storeHome.shortcutsEyebrow')} title={t('storeHome.shortcutsTitle')} linkText={t('storeHome.seeAllCategories')} linkTo="/ecommerce/categories" />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(categories.length ? categories.slice(0, 4) : [{ id: 1, name: 'Laptops' }, { id: 2, name: 'Mobiles' }, { id: 3, name: 'Headphones' }, { id: 4, name: 'Smartwatches' }]).map((category) => {
            const Icon = categoryIcons[category.name] ?? Smartphone
            return <Link key={category.id} to={`/ecommerce/categories?cat=${category.id}`} className="group flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:-translate-y-0.5 hover:border-(--color-text)/25 hover:shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-ecom-primary)"><Icon size={19} /></span><span><span className="block text-sm font-semibold" data-no-ui-translate>{category.name}</span><span className="mt-1 block text-xs text-(--color-muted)">{t('home.exploreNow')}</span></span><ChevronRight size={15} className="ml-auto text-(--color-muted) transition-transform group-hover:translate-x-0.5" /></Link>
          })}
        </div>
      </section>

      {deals.length > 0 && <section><SectionHeading eyebrow={t('storeHome.liveNow')} title={t('storeHome.offersPicked')} linkText={t('storeHome.shopAllProducts')} linkTo="/ecommerce/categories" /><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">{[...deals].sort((a, b) => b.discount_percent - a.discount_percent).slice(0, 3).map((deal) => <ProductCard key={deal.id} product={deal.product} deal={deal} onAddToCart={addToCart} />)}</div></section>}

      <section><SectionHeading eyebrow={t('storeHome.pickedEyebrow')} title={t('storeHome.pickedTitle')} linkText={t('storeHome.browseEverything')} linkTo="/ecommerce/categories" /><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">{featured.length ? featured.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} onAddToCart={addToCart} />) : fallbackProducts.map((product) => <PreviewProduct key={product.name} {...product} />)}</div></section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-(--color-border) bg-(--color-surface-2) p-6 sm:p-8">
          <div className="flex items-center justify-between"><div><div className="eyebrow">{t('storeHome.communityEyebrow')}</div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">{t('storeHome.communityTitle')}</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent-lime)"><Heart size={18} /></span></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><QuoteCard quote={t('storeHome.quote1')} name="Nisha · Hyderabad" /><QuoteCard quote={t('storeHome.quote2')} name="Ravi · Guntur" /></div>
        </div>
        <div className="rounded-[2rem] bg-(--color-ecom-primary) p-6 text-white sm:p-8"><ShieldCheck size={21} className="text-(--color-accent-lime)" /><h2 className="mt-10 text-2xl font-semibold tracking-[-0.05em]">{t('storeHome.dataTitle')}</h2><p className="mt-3 text-sm leading-6 text-white/65">{t('storeHome.dataCopy')}</p><Link to="/support" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-(--color-accent-lime)">{t('storeHome.learnSupport')} <ArrowUpRight size={15} /></Link></div>
      </section>
    </div>
  )
}

function SectionHeading({ eyebrow, title, linkText, linkTo }: { eyebrow: string; title: string; linkText: string; linkTo: string }) { return <div className="flex items-end justify-between gap-4"><div><div className="eyebrow">{eyebrow}</div><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">{title}</h2></div><Link to={linkTo} className="hidden items-center gap-1 text-xs font-semibold text-(--color-ecom-primary) sm:flex">{linkText} <ArrowUpRight size={14} /></Link></div> }
function StatTile({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Sparkles }) { return <div className="flex items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-ecom-primary)"><Icon size={17} /></span><div><p className="text-xs text-(--color-muted)">{label}</p><p className="mt-1 text-base font-semibold">{value} <span className="text-xs font-normal text-(--color-muted)">{note}</span></p></div></div> }
function PreviewProduct({ name, brand, price, category, color }: { name: string; brand: string; price: number; category: string; color: string }) { return <Link to="/ecommerce/categories" className="group" data-no-ui-translate><div className={`product-placeholder relative flex aspect-[1.1/1] items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${color}`}><span className="absolute left-4 top-4 rounded-full bg-(--color-accent-lime) px-2.5 py-1 font-(family-name:--font-mono) text-[9px] font-medium uppercase tracking-[0.1em]">Selected</span><span className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/75 bg-white/55 text-(--color-ecom-primary) shadow-xl transition-transform duration-300 group-hover:scale-105"><Laptop size={47} strokeWidth={1.3} /></span><span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface) text-(--color-text)"><ArrowUpRight size={15} /></span></div><div className="pt-4"><p className="text-xs text-(--color-muted)">{brand} · {category}</p><h3 className="mt-1 text-sm font-semibold">{name}</h3><p className="mt-2 font-semibold">{formatINR(price)}</p></div></Link> }
function QuoteCard({ quote, name }: { quote: string; name: string }) { return <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><div className="mb-5 flex gap-1 text-(--color-accent-lime)"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="text-sm font-semibold leading-5">"{quote}"</p><p className="mt-4 text-xs text-(--color-muted)" data-no-ui-translate>{name}</p></div> }
