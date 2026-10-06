import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FallbackImage({
  src,
  alt,
  className,
  letter,
  loading = 'lazy',
}: {
  src?: string | null
  alt: string
  className?: string
  letter?: string
  loading?: 'lazy' | 'eager'
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-(--color-surface-2) text-(--color-muted)/40', className)}>
        {letter ? (
          <span className="font-(family-name:--font-display) text-5xl font-bold">{letter}</span>
        ) : (
          <ImageOff size={22} />
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
