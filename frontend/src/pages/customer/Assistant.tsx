import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ChevronRight, ClipboardList, Heart, Mic, Send, Sparkles, Volume2, VolumeX, Star, PackageX, RotateCcw, Square, X } from 'lucide-react'
import { api, type AssistantAction, type AssistantActionOption, type AssistantResponse } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/FallbackImage'
import { formatINR, cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  sentiment?: string
  intent?: string
  products?: { id: number; name: string; price: number; stock: number; rating: number; image_url?: string | null }[]
  action?: AssistantAction | null
}

type AssistantLanguage = 'en' | 'hi' | 'te'
type VoiceLanguage = AssistantLanguage | 'auto'
type ActionContext = { order_id?: number; item_id?: number; action_type?: string; confirmed?: boolean; language?: AssistantLanguage }

function AssistantActionPanel({
  action,
  onSelect,
  onConfirm,
  onCancel,
}: {
  action: AssistantAction
  onSelect: (option: AssistantActionOption) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  if (action.type === 'confirm_order_action') {
    return (
      <div className="mt-3 rounded-2xl bg-(--color-warning)/10 p-3.5">
        <p className="flex items-center gap-2 text-xs font-semibold"><ClipboardList size={14} className="text-(--color-warning)" /> {t('assistant.confirmAction')}</p>
        <div className="mt-2.5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-surface) px-2.5 py-2 text-xs font-semibold transition-colors hover:bg-black/5"><X size={13} /> {t('assistant.no')}</button>
          <button type="button" onClick={onConfirm} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-ecom-primary) px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-(--color-ecom-primary-hover)"><Check size={13} /> {t('assistant.confirm')}</button>
        </div>
      </div>
    )
  }

  if (action.type !== 'order_list' && action.type !== 'select_order' && action.type !== 'select_item') return null
  const options = action.options ?? []
  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={`${action.type}-${option.id}`}
          type="button"
          onClick={() => onSelect(option)}
          className="flex items-center gap-3 rounded-2xl bg-(--color-surface) p-2.5 text-left transition-colors hover:bg-(--color-ecom-primary)/8"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-(--color-ecom-primary)/12 text-(--color-ecom-primary)">{action.type === 'select_item' ? <RotateCcw size={14} /> : <ClipboardList size={14} />}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{option.label}</span><span className="mt-0.5 block truncate text-[10px] text-(--color-muted)">{option.subtitle}</span></span>
          <ChevronRight size={14} className="flex-shrink-0 text-(--color-muted)" />
        </button>
      ))}
    </div>
  )
}

export default function Assistant() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const SUGGESTIONS = [
    t('assistant.suggestion1'),
    t('assistant.suggestion2'),
    t('assistant.suggestion3'),
    t('assistant.suggestion4'),
    t('assistant.suggestion5'),
  ]
  const { user, domain } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => localStorage.getItem('assistant_voice_output') !== 'off')
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('auto')
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeoutRef = useRef<number | null>(null)
  const speechTokenRef = useRef(0)
  const voiceOutputEnabledRef = useRef(voiceOutputEnabled)

  useEffect(() => {
    api.get('/assistant/greeting', { params: { customer_id: user!.id, domain: domain ?? 'ecommerce' } }).then((r) => {
      setMessages([{ role: 'assistant', text: r.data.message }])
    })
  }, [domain, user])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => () => {
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current)
    recognitionRef.current?.abort()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    window.speechSynthesis?.cancel()
  }, [])

  const voiceLocale = (language: AssistantLanguage) => ({ en: 'en-IN', hi: 'hi-IN', te: 'te-IN' })[language]

  const clearRecordingTimer = () => {
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
  }

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  const speak = (text: string, language: AssistantLanguage) => {
    if (!voiceOutputEnabledRef.current || !('speechSynthesis' in window)) return
    const synthesis = window.speechSynthesis
    const locale = voiceLocale(language)
    const utter = new SpeechSynthesisUtterance(text)
    const token = speechTokenRef.current + 1
    speechTokenRef.current = token
    const voices = synthesis.getVoices()
    const voice = voices.find((item) => item.lang.toLowerCase() === locale.toLowerCase())
      ?? voices.find((item) => item.lang.toLowerCase().startsWith(language))
    utter.lang = locale
    if (voice) utter.voice = voice
    utter.rate = 1.02
    utter.onstart = () => {
      if (speechTokenRef.current === token) setSpeaking(true)
    }
    const finishSpeaking = () => {
      if (speechTokenRef.current === token) setSpeaking(false)
    }
    utter.onend = finishSpeaking
    utter.onerror = finishSpeaking
    setSpeaking(true)
    synthesis.cancel()
    synthesis.speak(utter)
  }

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled((enabled) => {
      const next = !enabled
      voiceOutputEnabledRef.current = next
      localStorage.setItem('assistant_voice_output', next ? 'on' : 'off')
      if (!next) {
        speechTokenRef.current += 1
        window.speechSynthesis?.cancel()
        setSpeaking(false)
      }
      return next
    })
  }

  const send = async (text: string, context: ActionContext = {}, responseLanguage?: AssistantLanguage) => {
    if (!text.trim() || speaking) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const language = responseLanguage ?? context.language
      const { data } = await api.post<AssistantResponse>('/assistant/query', {
        customer_id: user!.id,
        domain: domain ?? 'ecommerce',
        message: text,
        ...context,
        ...(language ? { language } : {}),
      })
      setMessages((prev) => [...prev, {
        role: 'assistant', text: data.reply, sentiment: data.sentiment, intent: data.intent, products: data.products, action: data.action,
      }])
      speak(data.reply, data.language ?? language ?? user?.language ?? 'en')
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: t('assistant.couldNotComplete') }])
    } finally {
      setLoading(false)
    }
  }

  const selectActionOption = (action: AssistantAction, option: AssistantActionOption) => {
    const orderId = option.order_id ?? (action.type === 'select_order' ? option.id : undefined)
    if (action.type === 'order_list') {
      send(`Show details for ${option.label}`, { action_type: action.operation === 'orders' ? 'orders' : 'track', order_id: orderId })
      return
    }
    if (action.type === 'select_item') {
      send(`I selected ${option.label}`, { action_type: action.operation, order_id: action.order_id, item_id: option.item_id ?? option.id })
      return
    }
    send(`I selected ${option.label}`, { action_type: action.operation, order_id: orderId })
  }

  const confirmAction = (action: AssistantAction) => {
    send(`Confirm ${action.operation}`, {
      action_type: action.operation,
      order_id: action.order_id,
      item_id: action.item_id,
      confirmed: true,
    })
  }

  const addProductToCart = (product: { id: number; name: string }) => {
    api.post('/cart', { customer_id: user!.id, product_id: product.id, quantity: 1, domain: domain ?? 'ecommerce' })
      .then(() => toast(t('common.addedToCart', { name: product.name })))
      .catch(() => toast(t('assistant.couldNotAddProductCart'), 'error'))
  }

  const addProductToWishlist = (product: { id: number; name: string }) => {
    api.post('/wishlist', { customer_id: user!.id, product_id: product.id, domain: domain ?? 'ecommerce' })
      .then(() => toast(t('assistant.savedToWishlist', { name: product.name })))
      .catch(() => toast(t('assistant.couldNotSaveWishlist'), 'error'))
  }

  const browserLanguage = voiceLanguage === 'auto' ? (user?.language ?? 'en') : voiceLanguage

  const stopRecording = () => {
    clearRecordingTimer()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      return
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }

  const startBrowserRecognition = () => {
    if (loading || speaking || listening) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast(t('assistant.voiceNotSupported'), 'error')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = voiceLocale(browserLanguage)
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      void send(transcript, {}, browserLanguage)
    }
    recognition.onend = () => {
      clearRecordingTimer()
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onerror = (event: any) => {
      clearRecordingTimer()
      recognitionRef.current = null
      setListening(false)
      if (event.error !== 'aborted') toast(t('assistant.voiceError'), 'error')
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      recordingTimeoutRef.current = window.setTimeout(() => stopRecording(), 60000)
    } catch {
      setListening(false)
      toast(t('assistant.voiceError'), 'error')
    }
  }

  const startServerRecording = async () => {
    if (loading || speaking || listening) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      startBrowserRecognition()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      audioChunksRef.current = []
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        clearRecordingTimer()
        void (async () => {
          const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          mediaRecorderRef.current = null
          stopMediaStream()
          setListening(false)
          if (!audio.size) {
            toast(t('assistant.voiceError'), 'error')
            return
          }
          const form = new FormData()
          form.append('audio', audio, `voice.${audio.type.includes('mp4') ? 'mp4' : 'webm'}`)
          form.append('language', voiceLanguage)
          try {
            const { data } = await api.post<{ text: string; language?: AssistantLanguage | null }>('/assistant/transcribe', form)
            const detectedLanguage = data.language ?? (voiceLanguage === 'auto' ? browserLanguage : voiceLanguage)
            await send(data.text, {}, detectedLanguage)
          } catch {
            toast(t('assistant.voiceError'), 'error')
          }
        })()
      }
      recorder.start(250)
      setListening(true)
      recordingTimeoutRef.current = window.setTimeout(() => stopRecording(), 60000)
    } catch {
      toast(t('assistant.voiceError'), 'error')
      stopMediaStream()
    }
  }

  const toggleMic = () => {
    if (listening) {
      stopRecording()
      return
    }
    if (!loading && !speaking) void startServerRecording()
  }

  const voiceButtonLabel = speaking
    ? t('assistant.speakingStatus')
    : loading
      ? t('assistant.thinking')
      : listening
        ? t('assistant.stopRecording')
        : t('assistant.startRecording')
  const voiceOutputLabel = voiceOutputEnabled ? t('assistant.muteAiVoice') : t('assistant.unmuteAiVoice')
  const inputDisabled = listening || loading || speaking

  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col bg-(--color-bg)">
      <div className="flex items-center gap-3 bg-(--color-surface)/90 px-4 py-4 backdrop-blur">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-black/5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-ecom-primary)">
          <Sparkles size={17} className="text-white" />
        </div>
        <div>
          <p className="font-(family-name:--font-display) text-sm font-bold">{t('assistant.headerTitle', { brand: domain === 'agriculture' ? 'AgriMart' : 'TechKart' })}</p>
          <p className="text-[11px] text-(--color-muted)">{t('assistant.subtitle')}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex items-end gap-2 animate-fade-up', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-(--color-ecom-primary)">
                  <Sparkles size={13} className="text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm',
                  m.role === 'user'
                    ? 'bg-(--color-ecom-primary) text-white rounded-br-sm'
                    : 'bg-(--color-ecom-primary)/8 rounded-bl-sm'
                )}
              >
                {m.text}
                {m.products && m.products.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-2xl bg-(--color-surface) p-2 text-left"
                      >
                        <button type="button" onClick={() => navigate(`/product/${p.id}`)} className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-(--color-surface-2)">
                          <FallbackImage src={p.image_url} alt={p.name} letter={p.name.slice(0, 1)} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => navigate(`/product/${p.id}`)} className="block max-w-full truncate text-left text-xs font-medium hover:text-(--color-ecom-primary)" data-no-ui-translate>{p.name}</button>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs font-bold text-(--color-ecom-primary)">{formatINR(p.price)}</span>
                            <span className="flex items-center gap-0.5 text-[10px] text-(--color-muted)"><Star size={9} className="fill-(--color-warning) text-(--color-warning)" /> {p.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5">
                          <button type="button" onClick={() => addProductToWishlist(p)} aria-label={t('assistant.saveToWishlistAria', { name: p.name })} className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-muted) transition-colors hover:text-(--color-danger)"><Heart size={13} /></button>
                          <button type="button" onClick={() => addProductToCart(p)} disabled={p.stock < 1} className="rounded-full bg-(--color-ecom-primary)/15 px-2 py-1.5 text-[10px] font-semibold text-(--color-ecom-primary) transition-colors hover:bg-(--color-ecom-primary)/25 disabled:cursor-not-allowed disabled:opacity-40">
                            {p.stock > 0 ? t('assistant.add') : <PackageX size={14} className="text-(--color-danger)" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.action && (
                  <AssistantActionPanel
                    action={m.action}
                    onSelect={(option) => selectActionOption(m.action as AssistantAction, option)}
                    onConfirm={() => confirmAction(m.action as AssistantAction)}
                    onCancel={() => setMessages((prev) => [...prev, { role: 'assistant', text: t('assistant.noProblemUnchanged') }])}
                  />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-end justify-start gap-2">
              <div className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-(--color-ecom-primary)">
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-(--color-ecom-primary)/8 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-muted) [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-muted) [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-muted)" />
              </div>
            </div>
          )}
          {!loading && messages.length <= 1 && (
            <div className="mt-1 flex flex-wrap gap-2 pl-9">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={inputDisabled}
                  className="card-lift rounded-full bg-(--color-surface) px-3 py-1.5 text-xs font-medium text-(--color-muted) transition-colors hover:text-(--color-text)"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-(--color-surface)/90 p-3 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
          <select
            value={voiceLanguage}
            onChange={(e) => setVoiceLanguage(e.target.value as VoiceLanguage)}
            disabled={inputDisabled}
            aria-label="Voice language"
            className="h-11 w-[82px] rounded-full border border-(--color-border) bg-(--color-surface-2) px-2 text-[11px] text-(--color-muted) outline-none transition focus:ring-2 focus:ring-(--color-ecom-primary)/50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <option value="auto">Auto</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="te">తెలుగు</option>
          </select>
          <button
            type="button"
            onClick={toggleVoiceOutput}
            aria-pressed={!voiceOutputEnabled}
            aria-label={voiceOutputLabel}
            title={voiceOutputLabel}
            className={cn(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-(--color-border) transition-all focus:outline-none focus:ring-2 focus:ring-(--color-ecom-primary)/45',
              voiceOutputEnabled
                ? 'bg-(--color-surface-2) text-(--color-muted) hover:text-(--color-text)'
                : 'bg-(--color-text) text-(--color-accent-lime)'
            )}
          >
            {voiceOutputEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            type="button"
            onClick={toggleMic}
            disabled={!listening && (loading || speaking)}
            aria-pressed={listening}
            aria-label={voiceButtonLabel}
            className={cn(
              'flex h-11 min-w-[150px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-(--color-ecom-primary)/45 sm:flex-none',
              listening && 'mic-pulse bg-(--color-danger) text-white hover:brightness-105',
              !listening && !loading && !speaking && 'bg-(--color-ecom-primary) text-white hover:bg-(--color-ecom-primary-hover)',
              !listening && (loading || speaking) && 'cursor-not-allowed bg-(--color-surface-2) text-(--color-muted) opacity-70'
            )}
          >
            {speaking ? <Volume2 size={17} /> : listening ? <Square size={15} className="fill-current" /> : <Mic size={17} />}
            <span>{voiceButtonLabel}</span>
          </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !inputDisabled) void send(input)
            }}
            disabled={inputDisabled}
            placeholder={listening ? t('assistant.recordingPlaceholder') : t('assistant.inputPlaceholder')}
            className="h-11 min-w-0 flex-1 rounded-full bg-(--color-surface-2) px-4 text-sm outline-none transition focus:ring-2 focus:ring-(--color-ecom-primary)/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button size="icon" className="h-11 w-11 flex-shrink-0 rounded-full" onClick={() => send(input)} disabled={inputDisabled || !input.trim()}>
            <Send size={16} />
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
