import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, Clock3, CreditCard, Headset, MessageCircle, PackageSearch, Plus, RotateCcw, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, type Ticket } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TicketThread } from '@/components/TicketThread'
import { Pagination, paginate } from '@/components/ui/pagination'

const STATUS_VARIANT: Record<string, any> = { open: 'danger', in_progress: 'warning', closed: 'success' }
const PAGE_SIZE = 6

export default function Support() {
  const { t, i18n } = useTranslation()
  const HELP_TOPICS = [
    { title: t('support.topicTrackOrderTitle'), description: t('support.topicTrackOrderDesc'), icon: PackageSearch, type: 'orders' },
    { title: t('support.topicReturnsTitle'), description: t('support.topicReturnsDesc'), icon: RotateCcw, type: 'returns' },
    { title: t('support.topicBillingTitle'), description: t('support.topicBillingDesc'), icon: CreditCard, type: 'billing' },
    { title: t('support.topicProductsTitle'), description: t('support.topicProductsDesc'), icon: MessageCircle, type: 'products' },
  ]
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [composing, setComposing] = useState(false)
  const [active, setActive] = useState<Ticket | null>(null)
  const [page, setPage] = useState(1)
  const { pageItems, pageCount, clampedPage } = paginate(tickets, PAGE_SIZE, page)
  const homePath = domain === 'agriculture' ? '/agriculture' : '/ecommerce'

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await api.get<Ticket[]>('/support-tickets', { params: { customer_id: user.id } })
      setTickets(data)
    } catch {
      toast(t('support.couldNotLoad'), 'error')
    }
  }, [toast, user?.id])

  useEffect(() => { load() }, [load])

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return HELP_TOPICS
    return HELP_TOPICS.filter((topic) => `${topic.title} ${topic.description}`.toLowerCase().includes(query))
  }, [search, i18n.language])

  const startTicket = (nextSubject = '', nextMessage = '') => {
    setSubject(nextSubject)
    setMessage(nextMessage)
    setComposing(true)
    window.setTimeout(() => document.getElementById('support-ticket-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  const submit = async () => {
    if (!subject.trim() || !message.trim() || !user?.id) return
    try {
      const { data } = await api.post<Ticket>('/support-tickets', { customer_id: user.id, subject: subject.trim(), message: message.trim() })
      setSubject('')
      setMessage('')
      setComposing(false)
      await load()
      setActive(data)
      toast(t('support.ticketSubmitted'))
    } catch {
      toast(t('support.couldNotSubmit'), 'error')
    }
  }

  const onThreadChanged = (updated: Ticket) => {
    setActive(updated)
    setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 md:px-0 md:pt-2">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-(--color-muted)">
            <Link to={homePath} className="transition-colors hover:text-(--color-text)">{t('common.home')}</Link>
            <span>/</span>
            <span className="text-(--color-text)">{t('support.breadcrumbSupport')}</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight sm:text-3xl">{t('support.title')}</h1>
          <p className="mt-1 text-sm text-(--color-muted)">{t('support.subtitle')}</p>
        </div>
        <Button className="hidden sm:inline-flex" onClick={() => startTicket()}><Plus size={16} /> {t('support.newTicket')}</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="relative overflow-hidden rounded-3xl bg-(--color-ecom-primary) p-6 text-white sm:p-8">
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold"><Headset size={13} /> {t('support.customerCare')}</span>
                <h2 className="mt-4 font-(family-name:--font-display) text-2xl font-bold leading-tight sm:text-3xl">{t('support.howCanWeHelp', { name: user?.name ? `, ${user.name.split(' ')[0]}` : '' })}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/75">{t('support.howCanWeHelpDesc')}</p>
              </div>
              <div className="hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex"><Headset size={28} /></div>
            </div>
            <div className="relative mt-6 flex h-12 items-center rounded-full bg-white/12 px-4 focus-within:ring-2 focus-within:ring-white/40">
              <Search size={17} className="mr-3 flex-shrink-0 text-white/70" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('support.searchPlaceholder')} className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
              {search && <button type="button" onClick={() => setSearch('')} className="text-xs font-semibold">{t('support.clear')}</button>}
            </div>
          </section>

          <section className="card-lift rounded-3xl bg-(--color-surface) p-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><h2 className="font-(family-name:--font-display) font-bold">{t('support.popularTopics')}</h2><p className="mt-1 text-xs text-(--color-muted)">{t('support.popularTopicsDesc')}</p></div>
              <Link to="/assistant" className="hidden items-center gap-1 text-xs font-semibold text-(--color-ecom-primary) sm:flex">{t('support.askAiAssistant')} <ArrowRight size={13} /></Link>
            </div>
            {filteredTopics.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredTopics.map((topic) => {
                  const Icon = topic.icon
                  const content = <><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-ecom-primary)/12 text-(--color-ecom-primary)"><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{topic.title}</span><span className="mt-1 block text-xs leading-4 text-(--color-muted)">{topic.description}</span></span><ChevronRight size={16} className="flex-shrink-0 text-(--color-muted)" /></>
                  if (topic.type === 'orders') return <Link key={topic.title} to="/orders" className="flex items-center gap-3 rounded-2xl bg-(--color-surface-2) p-4 text-left transition-colors hover:bg-(--color-ecom-primary)/8">{content}</Link>
                  return <button key={topic.title} type="button" onClick={() => startTicket(topic.title, t('support.needHelpWith', { topic: topic.title.toLowerCase() }))} className="flex items-center gap-3 rounded-2xl bg-(--color-surface-2) p-4 text-left transition-colors hover:bg-(--color-ecom-primary)/8">{content}</button>
                })}
              </div>
            ) : <p className="rounded-2xl bg-(--color-surface-2) p-6 text-center text-sm text-(--color-muted)">{t('support.noTopicsMatch', { query: search })}</p>}
          </section>

          <section className="card-lift rounded-3xl bg-(--color-surface) p-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><h2 className="font-(family-name:--font-display) font-bold">{t('support.yourConversations')}</h2><p className="mt-1 text-xs text-(--color-muted)">{t('support.yourConversationsDesc')}</p></div>
              {tickets.length > 0 && <span className="rounded-full bg-(--color-surface-2) px-2.5 py-1 text-[11px] text-(--color-muted)">{t('support.totalCount', { count: tickets.length })}</span>}
            </div>
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-(--color-surface-2) px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-surface) text-(--color-muted)"><MessageCircle size={21} /></span>
                <p className="mt-3 text-sm font-semibold">{t('support.noConversations')}</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-(--color-muted)">{t('support.noConversationsDesc')}</p>
                <Button size="lg" className="mt-4" onClick={() => startTicket()}>{t('support.startConversation')} <ArrowRight size={14} /></Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pageItems.map((ticket) => {
                  const last = ticket.messages[ticket.messages.length - 1]
                  return (
                    <button key={ticket.id} type="button" onClick={() => setActive(ticket)} className="flex items-center gap-3 rounded-2xl bg-(--color-surface-2) p-4 text-left transition-colors hover:bg-(--color-ecom-primary)/8">
                      <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-ecom-primary)/10 text-(--color-ecom-primary) sm:flex"><MessageCircle size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-semibold text-(--color-muted)">{t('support.ticketNumber', { id: ticket.id })}</span><Badge variant={STATUS_VARIANT[ticket.status] ?? 'default'}>{ticket.status.replace('_', ' ')}</Badge></span>
                        <span className="mt-1 block truncate text-sm font-semibold">{ticket.subject}</span>
                        <span className="mt-1 block truncate text-xs text-(--color-muted)">{last?.message ?? ticket.message}</span>
                        <span className="mt-2 flex items-center gap-3 text-[10px] text-(--color-muted)"><span className="flex items-center gap-1"><MessageCircle size={11} /> {t('support.messagesCount', { count: ticket.messages.length })}</span><span>{new Date(ticket.created_at).toLocaleDateString()}</span></span>
                      </span>
                      <ChevronRight size={17} className="flex-shrink-0 text-(--color-muted)" />
                    </button>
                  )
                })}
              </div>
            )}
            {tickets.length > 0 && <div className="mt-4"><Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={tickets.length} pageSize={PAGE_SIZE} /></div>}
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          {composing ? (
            <section id="support-ticket-form" className="card-lift rounded-3xl bg-(--color-surface) p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-(family-name:--font-display) font-bold">{t('support.tellUsWhatYouNeed')}</h2><p className="mt-1 text-xs leading-5 text-(--color-muted)">{t('support.tellUsDesc')}</p></div>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-(--color-ecom-primary)/12 text-(--color-ecom-primary)"><Headset size={17} /></span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <label className="text-xs font-semibold">{t('support.subject')}<Input className="mt-1.5" placeholder={t('support.subjectPlaceholder')} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
                <label className="text-xs font-semibold">{t('support.yourMessage')}<Textarea className="mt-1.5 min-h-32" placeholder={t('support.messagePlaceholder')} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
                <div className="flex gap-2 pt-1"><Button variant="secondary" className="flex-1" onClick={() => setComposing(false)}>{t('common.cancel')}</Button><Button className="flex-1" onClick={submit} disabled={!subject.trim() || !message.trim()}>{t('support.sendRequest')} <ArrowRight size={14} /></Button></div>
              </div>
            </section>
          ) : (
            <section className="card-lift rounded-3xl bg-(--color-surface) p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--color-ecom-primary)/12 text-(--color-ecom-primary)"><Headset size={20} /></span>
              <h2 className="mt-4 font-(family-name:--font-display) text-lg font-bold">{t('support.needMoreHelp')}</h2>
              <p className="mt-1 text-sm leading-6 text-(--color-muted)">{t('support.needMoreHelpDesc')}</p>
              <Button size="lg" className="mt-5 w-full" onClick={() => startTicket()}>{t('support.createTicket')} <Plus size={16} /></Button>
              <Link to="/assistant" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-(--color-surface-2) px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-black/5"><Sparkles size={14} className="text-(--color-ecom-primary)" /> {t('support.getProductSuggestions')}</Link>
            </section>
          )}

          <section className="card-lift rounded-3xl bg-(--color-surface) p-6">
            <h2 className="font-(family-name:--font-display) font-bold">{t('support.supportPromise')}</h2>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex gap-3"><Clock3 size={17} className="mt-0.5 flex-shrink-0 text-(--color-ecom-primary)" /><div><p className="text-xs font-semibold">{t('support.everyRequestTracked')}</p><p className="mt-1 text-[11px] leading-4 text-(--color-muted)">{t('support.everyRequestTrackedDesc')}</p></div></div>
              <div className="flex gap-3"><ShieldCheck size={17} className="mt-0.5 flex-shrink-0 text-(--color-success)" /><div><p className="text-xs font-semibold">{t('support.detailsProtected')}</p><p className="mt-1 text-[11px] leading-4 text-(--color-muted)">{t('support.detailsProtectedDesc')}</p></div></div>
            </div>
          </section>
        </aside>
      </div>

      <TicketThread ticket={active} onClose={() => setActive(null)} viewAs="customer" onChanged={onThreadChanged} />
    </div>
  )
}
