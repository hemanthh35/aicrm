import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Languages, KeyRound, User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: 'en' | 'te' | 'hi'; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
]

export default function Profile() {
  const { t } = useTranslation()
  const { user, logout, setLanguage, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [lang, setLang] = useState(user?.language ?? 'en')
  const [savingLang, setSavingLang] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile({ name, phone, city })
      toast(t('profile.profileUpdated'))
    } catch {
      toast(t('profile.couldNotUpdateProfile'), 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const saveLanguage = async (code: 'en' | 'te' | 'hi') => {
    setLang(code)
    setSavingLang(true)
    try {
      await setLanguage(code)
      toast(t('profile.languageSaved'))
    } catch {
      toast(t('profile.couldNotSaveLanguage'), 'error')
    } finally {
      setSavingLang(false)
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast(t('profile.passwordsNoMatch'), 'error')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      toast(t('profile.passwordChanged'))
    } catch (err: any) {
      toast(err?.response?.data?.detail ?? t('profile.couldNotChangePassword'), 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-text)">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border border-(--color-border) bg-(--color-surface-2)">
          <img
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user?.email ?? 'guest')}&backgroundColor=4f6bff`}
            alt={user?.name ?? 'Profile'}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-(family-name:--font-display) text-xl font-bold">{user?.name}</h1>
          <p className="text-sm text-(--color-muted)">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-(--color-ecom-primary)/15 px-2 py-0.5 text-[11px] font-semibold capitalize text-(--color-ecom-primary)">
            {user?.role}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User size={16} /> {t('profile.profileDetails')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-muted)">{t('profile.fullName')}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-(--color-muted)">{t('profile.phone')}</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-(--color-muted)">{t('profile.city')}</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={savingProfile} className="mt-1 w-fit">
              {savingProfile ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Languages size={16} /> {t('profile.languagePreference')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              disabled={savingLang}
              onClick={() => saveLanguage(l.code)}
              className={cn(
                'flex items-center justify-between rounded-xl border p-3 text-left transition-colors',
                lang === l.code ? 'border-(--color-ecom-primary) bg-(--color-ecom-primary)/10' : 'border-(--color-border)'
              )}
            >
              <span>
                <p className="font-semibold">{l.native}</p>
                <p className="text-xs text-(--color-muted)">{l.label}</p>
              </span>
              {lang === l.code && <Check size={18} className="text-(--color-ecom-primary)" />}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound size={16} /> {t('profile.changePassword')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="flex flex-col gap-3">
            <Input type="password" placeholder={t('profile.currentPassword')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <Input type="password" placeholder={t('profile.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            <Input type="password" placeholder={t('profile.confirmNewPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            <Button type="submit" disabled={savingPassword} className="mt-1 w-fit">
              {savingPassword ? t('profile.updating') : t('profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="secondary" onClick={() => { logout(); navigate('/') }} className="w-fit">
        <LogOut size={15} /> {t('common.logout')}
      </Button>
    </div>
  )
}
