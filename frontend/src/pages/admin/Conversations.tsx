import { useEffect, useMemo, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminListToolbar } from '@/components/admin/AdminListToolbar'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Pagination, paginate } from '@/components/ui/pagination'
import { api, type Conversation, type ConversationSummary, type SentimentBreakdown } from '@/lib/api'

const PAGE_SIZE = 10

const SENTIMENT_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  positive: 'success',
  negative: 'danger',
  frustrated: 'danger',
  neutral: 'default',
}

export default function AdminConversations({ domain }: { domain: 'ecommerce' | 'agriculture' }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [sentiment, setSentiment] = useState<SentimentBreakdown[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const visibleConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return conversations.filter((conversation) => {
      const matchesSearch = !query || `${conversation.customer_name ?? ''} ${conversation.last_message ?? ''} ${conversation.last_sentiment ?? ''}`.toLocaleLowerCase().includes(query)
      const matchesSentiment = sentimentFilter === 'all' || conversation.last_sentiment === sentimentFilter
      return matchesSearch && matchesSentiment
    })
  }, [conversations, search, sentimentFilter])
  const { pageItems, pageCount, clampedPage } = paginate(visibleConversations, PAGE_SIZE, page)

  const load = () => {
    api.get<ConversationSummary[]>('/conversations', { params: { domain } }).then((r) => setConversations(r.data))
    api.get<SentimentBreakdown[]>('/conversations/analytics/sentiment', { params: { domain } }).then((r) => setSentiment(r.data))
  }
  useEffect(() => { load() }, [domain])

  const openConversation = async (id: number) => {
    const { data } = await api.get<Conversation>(`/conversations/${id}`)
    setSelected(data)
  }

  const totalMessages = sentiment.reduce((sum, s) => sum + s.count, 0)

  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle={`${conversations.length} conversations · sentiment and chat history from the AI assistant`}
      />
      <div className="grid grid-cols-2 gap-3 px-6 pt-6 sm:grid-cols-4 md:px-8">
        {sentiment.map((s) => (
          <div key={s.sentiment} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <p className="text-xs capitalize text-(--color-muted)">{s.sentiment}</p>
            <p className="mt-1 text-xl font-bold">{s.count}</p>
            <p className="text-[11px] text-(--color-muted)">{totalMessages ? Math.round((s.count / totalMessages) * 100) : 0}%</p>
          </div>
        ))}
      </div>
      <div className="p-6 md:p-8">
        <div className="mb-4 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <AdminListToolbar
            value={search}
            onChange={(value) => { setSearch(value); setPage(1) }}
            placeholder="Search conversations…"
            filters={
              <select value={sentimentFilter} onChange={(e) => { setSentimentFilter(e.target.value); setPage(1) }} aria-label="Filter conversations by sentiment" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
                <option value="all">All sentiment</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
                <option value="frustrated">Frustrated</option>
              </select>
            }
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full text-sm">
            <thead className="border-b border-(--color-border) text-left text-xs text-(--color-muted)">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Last Message</th>
                <th className="px-4 py-3">Sentiment</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className="cursor-pointer border-b border-(--color-border) last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-medium">{c.customer_name ?? `#${c.customer_id}`}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-(--color-muted)">{c.last_message ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.last_sentiment ? <Badge variant={SENTIMENT_VARIANT[c.last_sentiment] ?? 'default'}>{c.last_sentiment}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3">{c.message_count}</td>
                  <td className="px-4 py-3 text-(--color-muted)">{new Date(c.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleConversations.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-(--color-muted)">
              <MessageSquare size={22} />
              <p className="text-sm">No conversations yet.</p>
            </div>
          )}
        </div>
        {conversations.length > 0 && (
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={conversations.length} pageSize={PAGE_SIZE} />
        )}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Conversation #${selected.id}` : ''}>
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {selected?.messages.map((m) => (
            <div key={m.id} className={`rounded-xl p-3 text-sm ${m.sender === 'customer' ? 'bg-(--color-surface-2)' : 'bg-(--color-ecom-primary)/10'}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold capitalize">{m.sender}</span>
                {m.sentiment && <Badge variant={SENTIMENT_VARIANT[m.sentiment] ?? 'default'}>{m.sentiment}</Badge>}
              </div>
              <p>{m.content}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
