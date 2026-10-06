import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Package, Headset, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Notification } from '@/lib/api'

const ICONS: Record<Notification['type'], typeof Sparkles> = {
  info: Sparkles,
  order: Package,
  support: Headset,
  recommendation: Sparkles,
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationBell({ userId }: { domain?: 'ecommerce' | 'agriculture'; userId?: number }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const load = () => {
    if (!userId) return
    api.get<Notification[]>('/notifications').then((r) => setNotifications(r.data)).catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const openNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      await api.put(`/notifications/${notification.id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
    }
    setIsOpen(false)
    if (notification.link_url) navigate(notification.link_url)
  }

  const markAllAsRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) transition-all hover:border-(--color-ecom-primary)/40 hover:bg-(--color-surface-2) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--color-accent-lime)/35 active:scale-95"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-danger) text-[10px] font-bold ring-2 ring-(--color-bg)">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card-lift animate-fade-up absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-(--color-surface)">
          <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="mt-0.5 text-[11px] text-(--color-muted)">
                {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-[11px] font-semibold text-(--color-ecom-primary) transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = ICONS[notification.type] ?? Sparkles
              return (
                <Link
                  key={notification.id}
                  to={notification.link_url ?? '#'}
                  onClick={(e) => { e.preventDefault(); openNotification(notification) }}
                  className={`flex gap-3 border-b border-(--color-border) px-4 py-3 transition-colors last:border-b-0 hover:bg-(--color-surface-2) ${notification.is_read ? 'opacity-65' : ''}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-(--color-ecom-primary)/12 text-(--color-ecom-primary)">
                    {notification.is_read ? <Check size={15} /> : <Icon size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold">{notification.title}</span>
                      {!notification.is_read && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-(--color-ecom-primary)" />}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-(--color-muted)">{notification.message}</span>
                    <span className="mt-1.5 block text-[10px] text-(--color-muted)">{timeAgo(notification.created_at)}</span>
                  </span>
                </Link>
              )
            })}
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-(--color-muted)">No notifications yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
