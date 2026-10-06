import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Send, Headset, ShieldCheck, RefreshCw, MessageCircleOff, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { api, type Ticket } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<string, any> = { open: 'danger', in_progress: 'warning', closed: 'success' }

export function TicketThread({
  ticket,
  onClose,
  viewAs,
  onChanged,
  headerActions,
}: {
  ticket: Ticket | null
  onClose: () => void
  viewAs: 'admin' | 'customer'
  onChanged: (ticket: Ticket) => void
  headerActions?: ReactNode
}) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [ticket])

  if (!ticket) return null

  const mine = viewAs === 'admin' ? 'admin' : 'customer'

  const refresh = async () => {
    setRefreshing(true)
    try {
      const { data } = await api.get<Ticket>(`/support-tickets/${ticket.id}`)
      onChanged(data)
    } finally {
      setRefreshing(false)
    }
  }

  const send = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/support-tickets/${ticket.id}/messages`, { sender: mine, message: reply.trim() })
      const { data } = await api.get<Ticket>(`/support-tickets/${ticket.id}`).catch(() => ({ data: null as any }))
      setReply('')
      if (data) onChanged(data)
      else onChanged(ticket)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={!!ticket} onClose={onClose} className="max-w-lg p-0 overflow-hidden">
      <div className="flex max-h-[82vh] flex-col">
        <div
          className="flex items-center justify-between gap-3 bg-(--color-ecom-primary)/8 p-5 pb-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-(--color-ecom-primary)/15 text-(--color-ecom-primary)">
              <Headset size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{ticket.subject}</p>
              <p className="mt-0.5 text-xs text-(--color-muted)">
                {viewAs === 'admin' ? ticket.customer?.name ?? 'Customer' : 'Support thread'} · #{ticket.id}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Badge variant={STATUS_VARIANT[ticket.status] ?? 'default'}>{ticket.status.replace('_', ' ')}</Badge>
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Refresh conversation"
              className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-black/5 hover:text-(--color-text) disabled:opacity-50"
            >
              <RefreshCw size={15} className={cn(refreshing && 'animate-spin')} />
            </button>
            {headerActions}
          </div>
        </div>

        {ticket.is_escalated && (
          <div className="flex items-center gap-2 bg-(--color-danger)/10 px-5 py-2.5 text-xs font-medium text-(--color-danger)">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>
              {viewAs === 'admin'
                ? `Escalated${ticket.escalation_reason ? ` — ${ticket.escalation_reason}` : ''}`
                : 'This issue was escalated to a human agent — they will follow up shortly.'}
            </span>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-(--color-bg) p-5">
          {ticket.messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-(--color-muted)">
              <MessageCircleOff size={24} />
              <p className="text-sm">No messages yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ticket.messages.map((m) => {
                const isMine = m.sender === mine
                return (
                  <div key={m.id} className={cn('flex animate-fade-up items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
                    {!isMine && (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-muted)">
                        {m.sender === 'admin' ? <ShieldCheck size={13} /> : <Headset size={13} />}
                      </span>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm',
                        isMine
                          ? 'bg-(--color-ecom-primary) text-white rounded-br-sm'
                          : 'bg-(--color-surface) rounded-bl-sm'
                      )}
                    >
                      {m.message}
                      <p className={cn('mt-1 text-[10px]', isMine ? 'text-white/70' : 'text-(--color-muted)')}>
                        {new Date(m.created_at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {ticket.status !== 'closed' ? (
          <div className="flex items-center gap-2 bg-(--color-surface) p-3">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
              placeholder={viewAs === 'admin' ? 'Reply to customer...' : 'Type a message...'}
              className="h-11 flex-1 rounded-full bg-(--color-surface-2) px-4 text-sm outline-none focus:ring-2 focus:ring-(--color-ecom-primary)/50"
            />
            <button
              onClick={send}
              disabled={sending || !reply.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-(--color-ecom-primary) text-white transition-opacity hover:bg-(--color-ecom-primary-hover) disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <p className="bg-(--color-surface) p-4 text-center text-xs text-(--color-muted)">This ticket is closed.</p>
        )}
      </div>
    </Modal>
  )
}
