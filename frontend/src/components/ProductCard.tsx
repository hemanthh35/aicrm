import { Heart, Star, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Deal, Product } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/FallbackImage'
import { formatINR, getEffectivePrice, cn } from '@/lib/utils'

export function ProductCard({
  product,
  deal,
  onAddToCart,
  onToggleWishlist,
  wished,
}: {
  product: Product
  deal?: Pick<Deal, 'discount_percent'> | null
  onAddToCart?: (p: Product) => void
  onToggleWishlist?: (p: Product) => void
  wished?: boolean
}) {
  const { t } = useTranslation()
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

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden rounded-3xl bg-(--color-surface-2)">
        {hasDeal && (
          <span className="tag-lime absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-bold">
            {t('home.percentOff', { percent: discount })}
          </span>
        )}
        <button
          onClick={() => onToggleWishlist?.(product)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface) hover:bg-(--color-surface-2)"
        >
          <Heart size={15} className={cn(wished ? 'fill-(--color-danger) text-(--color-danger)' : 'text-(--color-text)')} />
        </button>

        <Link to={`/product/${product.id}`} className="block aspect-square">
          <FallbackImage
            src={product.image_url}
            alt={product.name}
            letter={product.name.slice(0, 1)}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="text-xs text-(--color-muted)" data-no-ui-translate>{product.brand}</p>
        <Link to={`/product/${product.id}`} className="line-clamp-2 text-sm font-semibold hover:text-(--color-ecom-primary)" data-no-ui-translate>
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-(--color-muted)" aria-label={`${product.rating} out of 5 stars, ${product.rating_count} ratings`} data-no-ui-translate>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={11} className={index < Math.round(product.rating) ? 'fill-(--color-warning) text-(--color-warning)' : 'text-(--color-border)'} />
            ))}
          </span>
          <span className="ml-0.5">{product.rating.toFixed(1)} ({product.rating_count.toLocaleString()})</span>
        </div>
        <div className="mt-0.5 flex items-baseline gap-2" data-no-ui-translate>
          <span className="font-(family-name:--font-display) text-base font-bold">{formatINR(displayPrice)}</span>
          {hasDeal && (
            <span className="text-xs text-(--color-muted) line-through">{formatINR(compareAt as number)}</span>
          )}
        </div>
        <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => onAddToCart?.(product)}>
          <ShoppingCart size={14} /> {t('common.addToCart')}
        </Button>
      </div>
    </div>
  )
}
