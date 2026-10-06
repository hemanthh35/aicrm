import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Bell } from 'lucide-react'
import { api, type Ticket } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export function AdminTopbar({
  storeLink,
  storeDomain,
  storeLabel,
  ticketsLink,
  ticketRole,
}: {
  storeLink: string
  storeDomain: 'ecommerce' | 'agriculture'
  storeLabel: string
  ticketsLink: string
  ticketRole: 'customer' | 'farmer'
}) {
  const { user, setDomain } = useAuth()
  const navigate = useNavigate()
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => {
    api.get<Ticket[]>('/support-tickets', { params: { role: ticketRole } })
      .then((r) => setOpenCount(r.data.filter((t) => t.status === 'open').length))
      .catch(() => {})
  }, [ticketRole])

  const goToStore = () => {
    setDomain(storeDomain)
    navigate(storeLink)
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-(--color-border) bg-(--color-bg)/80 px-5 py-3.5 md:px-8">
      <button
        onClick={goToStore}
        className="flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-xs font-semibold text-(--color-muted) transition-colors hover:border-(--color-ecom-primary)/40 hover:text-(--color-text)"
      >
        <ExternalLink size={13} /> {storeLabel}
      </button>

      <button
        onClick={() => navigate(ticketsLink)}
        title="Open support tickets"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:text-(--color-text)"
      >
        <Bell size={16} />
        {openCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-accent-lime) text-[10px] font-bold text-(--color-text) ring-2 ring-(--color-bg)">
            {openCount > 9 ? '9+' : openCount}
          </span>
        )}
      </button>

      <button onClick={() => navigate('/profile')} className="flex items-center gap-2">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-(--color-border) bg-(--color-surface-2)">
          <img
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user?.email ?? 'admin')}&backgroundColor=4f6bff`}
            alt={user?.name ?? 'Profile'}
            className="h-full w-full object-cover"
          />
        </div>
      </button>
    </div>
  )
}
