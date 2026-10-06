import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Pencil, BookOpen, FileText, Upload } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminListToolbar } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Pagination, paginate } from '@/components/ui/pagination'
import { api, type KnowledgeBaseArticle, type KnowledgeDocument } from '@/lib/api'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' },
]

const PAGE_SIZE = 8

export default function AdminKnowledgeBase({ domain }: { domain: 'ecommerce' | 'agriculture' }) {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeBaseArticle | null>(null)
  const [form, setForm] = useState({ title: '', content: '', language: 'en' })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visibleArticles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return articles.filter((article) => {
      const matchesSearch = !query || `${article.title} ${article.content}`.toLocaleLowerCase().includes(query)
      const matchesLanguage = languageFilter === 'all' || article.language === languageFilter
      return matchesSearch && matchesLanguage
    })
  }, [articles, search, languageFilter])
  const { pageItems, pageCount, clampedPage } = paginate(visibleArticles, PAGE_SIZE, page)

  const load = async () => {
    const [articleResult, documentResult] = await Promise.allSettled([
      api.get<KnowledgeBaseArticle[]>('/knowledge-base', { params: { domain } }),
      api.get<KnowledgeDocument[]>('/knowledge-base/documents', { params: { domain } }),
    ])
    if (articleResult.status === 'fulfilled') setArticles(articleResult.value.data)
    if (documentResult.status === 'fulfilled') setDocuments(documentResult.value.data)
    else setUploadMessage('Could not load indexed documents. Refresh and try again.')
  }
  useEffect(() => { load() }, [domain])

  const uploadPdf = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')
    if (!isPdf && !isDocx) {
      setUploadMessage('Choose a PDF or DOCX file.')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('domain', domain)
    formData.append('language', form.language)
    setUploading(true)
    setUploadMessage('Extracting and indexing document…')
    try {
      await api.post('/knowledge-base/documents', formData)
      setUploadMessage('Document indexed for the assistant.')
      await load()
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.detail ?? 'Could not index this document.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeDocument = async (document: KnowledgeDocument) => {
    if (!confirm(`Remove "${document.original_filename}" from assistant knowledge?`)) return
    await api.delete(`/knowledge-base/documents/${document.id}`)
    await load()
  }

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '', language: 'en' }); setOpen(true) }
  const openEdit = (a: KnowledgeBaseArticle) => { setEditing(a); setForm({ title: a.title, content: a.content, language: a.language }); setOpen(true) }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    if (editing) await api.put(`/knowledge-base/${editing.id}`, form)
    else await api.post('/knowledge-base', { ...form, domain })
    setOpen(false)
    load()
  }
  const remove = async (a: KnowledgeBaseArticle) => {
    if (confirm(`Delete "${a.title}"?`)) { await api.delete(`/knowledge-base/${a.id}`); load() }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        subtitle={`${articles.length} articles · used by the AI assistant to answer questions accurately`}
        actions={<div className="flex flex-wrap gap-2"><input ref={fileInputRef} type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPdf(file) }} /><Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload size={16} /> {uploading ? 'Indexing…' : 'Upload PDF / DOCX'}</Button><Button onClick={openCreate}><Plus size={16} /> Add Article</Button></div>}
      />
      {uploadMessage && <p className="px-6 pt-4 text-xs text-(--color-muted) md:px-8">{uploadMessage}</p>}
      <div className="px-6 pt-6 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <AdminListToolbar
            value={search}
            onChange={(value) => { setSearch(value); setPage(1) }}
            placeholder="Search knowledge base…"
            filters={
              <select value={languageFilter} onChange={(e) => { setLanguageFilter(e.target.value); setPage(1) }} aria-label="Filter knowledge base by language" className="h-10 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)">
                <option value="all">All languages</option>
                {LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
              </select>
            }
          />
        </div>
      </div>
      {documents.length > 0 && <div className="px-6 pt-6 md:px-8"><div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">Indexed documents</p><p className="text-xs text-(--color-muted)">{documents.length} document{documents.length === 1 ? '' : 's'} available to the {domain === 'agriculture' ? 'AgriMart' : 'TechKart'} assistant</p></div></div><div className="grid gap-2 md:grid-cols-2">{documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl bg-(--color-surface-2) px-3 py-2.5"><FileText size={16} className="flex-shrink-0 text-(--color-ecom-primary)" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{document.original_filename}</p><p className="text-[11px] text-(--color-muted)">{document.page_count} pages · {document.chunk_count} chunks</p></div><button onClick={() => void removeDocument(document)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10" aria-label={`Remove ${document.original_filename}`}><Trash2 size={14} /></button></div>)}</div></div></div>}
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-8">
        {pageItems.map((a) => (
          <div key={a.id} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="mt-1 line-clamp-3 text-xs text-(--color-muted)">{a.content}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-(--color-muted) hover:bg-white/10 hover:text-(--color-text)"><Pencil size={14} /></button>
                <button onClick={() => remove(a)} className="rounded-lg p-1.5 text-(--color-danger) hover:bg-white/10"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="default">{LANGUAGES.find((l) => l.value === a.language)?.label ?? a.language}</Badge>
            </div>
          </div>
        ))}
        {visibleArticles.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-(--color-border) p-10 text-center text-(--color-muted)">
            <BookOpen size={22} />
            <p className="text-sm">No knowledge base articles yet. Add FAQs, policies, or guides the AI assistant should know.</p>
          </div>
        )}
      </div>
      {visibleArticles.length > 0 && (
        <div className="px-6 md:px-8">
          <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} totalItems={visibleArticles.length} pageSize={PAGE_SIZE} />
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Article' : 'Add Article'}>
        <div className="flex flex-col gap-3">
          <Input placeholder="Title (e.g. Return Policy)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea
            placeholder="Content — what should the AI assistant know and say about this?"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3 py-2 text-sm outline-none focus:border-(--color-ecom-primary)"
          />
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3 py-2 text-sm outline-none focus:border-(--color-ecom-primary)"
          >
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <Button onClick={save}>{editing ? 'Save Changes' : 'Create Article'}</Button>
        </div>
      </Modal>
    </div>
  )
}
