import { Star } from 'lucide-react'

export function TickerBar({ text }: { text: string }) {
  const items = Array.from({ length: 8 })
  return (
    <div className="tag-lime overflow-hidden py-2 text-xs font-bold uppercase tracking-wide">
      <div className="ticker-track">
        {items.map((_, i) => (
          <span key={i} className="flex items-center gap-8 pr-8">
            {text}
            <Star size={10} className="fill-current" />
          </span>
        ))}
      </div>
    </div>
  )
}
