import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Star, ShieldCheck, Heart, Truck, RotateCcw, Send, CheckCircle2 } from 'lucide-react'
import { api, type Deal, type Product, type Review } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/FallbackImage'
import { formatINR, getEffectivePrice, cn } from '@/lib/utils'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [qty, setQty] = useState(1)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    api.get<Product>(`/products/${id}`).then((r) => setProduct(r.data))
    api.get<Deal[]>('/deals', { params: { active_only: true, domain: domain ?? undefined } }).then((r) => setDeal(r.data.find((item) => item.product.id === Number(id)) ?? null)).catch(() => {})
    api.get<Review[]>('/reviews', { params: { product_id: id } }).then((r) => setReviews(r.data))
  }, [id, domain])

  if (!product) return <div className="p-6 text-(--color-muted)">{t('common.loading')}</div>

  const activeDeal = deal ?? product.active_deal
  const hasOriginalPrice = product.original_price && product.original_price > product.price
  const hasDeal = Boolean(activeDeal) || Boolean(hasOriginalPrice)
  const discount = activeDeal
    ? Math.round(activeDeal.discount_percent)
    : hasOriginalPrice
      ? Math.round((1 - product.price / (product.original_price as number)) * 100)
      : 0
  const displayPrice = activeDeal ? Math.max(0, Math.round(product.price * (1 - activeDeal.discount_percent / 100) * 100) / 100) : getEffectivePrice(product)
  const compareAt = activeDeal ? product.price : product.original_price

  const submitReview = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!selectedRating) {
      toast('Choose a star rating first', 'error')
      return
    }
    setSubmittingReview(true)
    try {
      await api.post('/reviews', {
        product_id: product.id,
        customer_id: user.id,
        rating: selectedRating,
        comment: reviewComment.trim() || null,
      })
      setReviewSubmitted(true)
      setSelectedRating(0)
      setReviewComment('')
      toast('Your review was submitted for approval')
    } catch {
      toast('Could not submit your review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-5 pb-10 md:px-0">
      <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-1.5 text-sm text-(--color-muted) hover:text-(--color-text)">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Image */}
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-3xl bg-(--color-surface-2)">
            <FallbackImage src={product.image_url} alt={product.name} letter={product.name.slice(0, 1)} loading="eager" />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-muted)" data-no-ui-translate>{product.brand}</p>
          <h1 className="mt-1 font-(family-name:--font-display) text-2xl font-bold md:text-3xl" data-no-ui-translate>{product.name}</h1>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-(--color-muted)">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.round(product.rating) ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} />
              ))}
            </div>
            {product.rating} · {t('product.ratingsCount', { count: product.rating_count.toLocaleString() })}
          </div>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-(--color-muted)">{product.description}</p>
          )}

          <div className="my-6 h-px w-full bg-(--color-border)" />

          <div className="flex items-baseline gap-3">
            <span className="font-(family-name:--font-display) text-3xl font-bold">{formatINR(displayPrice)}</span>
            {hasDeal && (
              <>
                <span className="text-(--color-muted) line-through">{formatINR(compareAt as number)}</span>
                <span className="tag-lime rounded-full px-2.5 py-0.5 text-xs font-bold">{discount}% off</span>
              </>
            )}
          </div>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-(--color-success)">{t('product.inStock', { count: product.stock })}</span>
            ) : (
              <span className="text-(--color-danger)">{t('common.outOfStock')}</span>
            )}
          </p>

          {/* Quantity */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">{t('product.quantity')}</p>
            <div className="inline-flex items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) p-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-black/5">−</button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-black/5">+</button>
            </div>
          </div>

          {/* Assurances */}
          <div className="mt-6 flex flex-col gap-2.5 rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 text-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="flex-shrink-0 text-(--color-success)" />
              {product.warranty}
            </div>
            <div className="flex items-center gap-2.5">
              <Truck size={16} className="flex-shrink-0 text-(--color-success)" />
              {t('product.freeShipping')}
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw size={16} className="flex-shrink-0 text-(--color-success)" />
              {t('product.easyReturns')}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={() =>
                api.post('/cart', { customer_id: user!.id, product_id: product.id, quantity: qty, domain: domain ?? 'ecommerce' })
                  .then(() => toast(t('common.addedToCart', { name: product.name })))
                  .catch(() => toast(t('common.couldNotAddToCart'), 'error'))
              }
            >
              {t('common.addToCart')}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-14 w-14 flex-shrink-0"
              onClick={() =>
                api.post('/wishlist', { customer_id: user!.id, product_id: product.id, domain: domain ?? 'ecommerce' })
                  .then(() => toast(t('common.addedToWishlist', { name: product.name })))
                  .catch(() => toast(t('common.couldNotAddToWishlist'), 'error'))
              }
            >
              <Heart size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-14">
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-(--color-muted)">Customer rating</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-(family-name:--font-display) text-4xl font-bold leading-none">{product.rating.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-0.5" aria-label={`${product.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} className={index < Math.round(product.rating) ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} />)}
                </div>
                <p className="mt-1 text-xs text-(--color-muted)">{product.rating_count.toLocaleString()} ratings</p>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right"><p className="text-sm font-semibold">{t('product.reviews', { count: reviews.length })}</p><p className="mt-1 text-xs text-(--color-muted)">Verified customer feedback</p></div>
        </div>
        <div className={cn('grid grid-cols-1 gap-3', reviews.length > 0 && 'md:grid-cols-2')}>
          {reviews.length === 0 && <p className="text-sm text-(--color-muted)">{t('common.noReviewsYet')}</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.customer?.name ?? t('product.anonymous')}</p>
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} className="fill-(--color-warning) text-(--color-warning)" /> {r.rating}
                </div>
              </div>
              <p className="mt-1.5 text-sm text-(--color-muted)">{r.comment}</p>
            </div>
          ))}
        </div>

        {user && (
          <div className="mt-5 rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
            {reviewSubmitted ? (
              <div className="flex items-start gap-3 rounded-2xl bg-(--color-surface-2) p-4"><CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-(--color-success)" /><div><p className="text-sm font-semibold">Thanks for sharing your experience.</p><p className="mt-1 text-xs leading-5 text-(--color-muted)">Your rating is waiting for approval and will appear here once it is published.</p></div></div>
            ) : (
              <div className="grid gap-5 md:grid-cols-[0.7fr_1.3fr] md:items-start">
                <div><p className="text-sm font-semibold">Rate this product</p><p className="mt-1 text-xs text-(--color-muted)">How did it work for you?</p><div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHoverRating(0)} role="radiogroup" aria-label="Choose a rating from 1 to 5 stars">{Array.from({ length: 5 }).map((_, index) => { const value = index + 1; const active = value <= (hoverRating || selectedRating); return <button key={value} type="button" onMouseEnter={() => setHoverRating(value)} onClick={() => setSelectedRating(value)} className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--color-accent-lime)/35" aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-checked={selectedRating === value} role="radio"><Star size={23} className={active ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} /></button> })}</div></div>
                <div className="flex flex-col"><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Add a short note (optional)" maxLength={2000} className="min-h-24 w-full resize-y rounded-2xl border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-sm outline-none transition-all placeholder:text-(--color-muted) focus:border-(--color-ecom-primary) focus:ring-4 focus:ring-(--color-accent-lime)/25" /><div className="mt-2 flex items-center justify-end"><Button size="sm" onClick={submitReview} disabled={submittingReview || !selectedRating}><Send size={14} /> {submittingReview ? 'Submitting…' : 'Submit rating'}</Button></div></div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
