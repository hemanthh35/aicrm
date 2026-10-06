import { useNavigate } from 'react-router-dom'
import { Languages, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: 'en' | 'te' | 'hi'; label: string; native: string; description: string }[] = [
  { code: 'en', label: 'English', native: 'English', description: 'Clear, familiar, and direct' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', description: 'సులభమైన, సహజమైన అనుభవం' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', description: 'सरल और सहज अनुभव' },
]

export default function LanguageSelect() {
  const { user, setLanguage } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [selected, setSelected] = useState<'en' | 'te' | 'hi'>(user?.language ?? 'en')
  const [loading, setLoading] = useState(false)

  const confirm = async () => {
    setLoading(true)
    try {
      await setLanguage(selected)
      navigate('/domain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-ecom-primary) to-(--color-ecom-glow)">
        <Languages size={20} className="text-white" />
      </div>
      <h1 className="font-(family-name:--font-display) text-2xl font-bold">{t('language.title')}</h1>
      <p className="mt-1 text-sm text-(--color-muted)">{t('language.subtitle')}</p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setSelected(lang.code)}
            className={cn(
              'flex items-center justify-between rounded-2xl border p-4 text-left transition-all',
              selected === lang.code ? 'border-(--color-ecom-primary) bg-(--color-ecom-primary)/10 shadow-[0_12px_30px_rgba(11,107,78,0.1)]' : 'border-(--color-border) bg-(--color-surface) hover:-translate-y-0.5 hover:border-(--color-ecom-primary)/40'
            )}
          >
            <span>
              <p className="text-lg font-semibold">{lang.native}</p>
              <p className="mt-1 text-xs text-(--color-muted)">{lang.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-(--color-muted)">{lang.label}</p>
            </span>
            {selected === lang.code && <Check size={18} className="text-(--color-ecom-primary)" />}
          </button>
        ))}
      </div>

      <Button className="mt-8 w-full max-w-sm" onClick={confirm} disabled={loading}>
        {loading ? t('common.loading') : t('common.continue')}
      </Button>
    </div>
  )
}
