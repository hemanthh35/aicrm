import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/language')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? t('login.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-page grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden flex-col justify-between bg-(--color-text) p-10 text-white lg:flex xl:p-14">
        <div />
        <div className="max-w-md">
          <div className="eyebrow text-(--color-accent-lime)">Your signal, together</div>
          <h1 className="display-heading mt-5 text-6xl leading-[0.92]">Welcome back to the rhythm.</h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/60">Your customers, orders, and conversations are waiting in one calm place.</p>
          <div className="mt-9 space-y-3 text-sm text-white/75">
            <p className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Check size={13} /></span> Pick up exactly where you left off</p>
            <p className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-accent-lime) text-(--color-text)"><Check size={13} /></span> Keep every conversation in context</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/45"><ShieldCheck size={14} /> Private by default</div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8"><p className="eyebrow">Sign in</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Good to see you.</h2><p className="mt-2 text-sm text-(--color-muted)">Pick up your workspace where you left it.</p></div>

          <form onSubmit={submit} className="auth-form flex flex-col gap-4">
            <label className="text-sm font-semibold">Email<input className="mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label className="text-sm font-semibold">
              Password
              <span className="relative mt-2 block">
                <input className="mt-0 pr-12" type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-surface-2) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ecom-primary)" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {error && <p className="text-xs text-(--color-danger)">{error}</p>}
            <Button type="submit" disabled={loading} className="button-lime mt-2 h-12">{loading ? 'Signing in…' : 'Continue'} <ArrowRight size={15} /></Button>
          </form>

          <p className="mt-7 text-sm text-(--color-muted)">New here? <Link to="/signup" className="font-semibold text-(--color-ecom-primary)">Create an account</Link></p>
          <div className="mt-10 rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-4 text-xs leading-5 text-(--color-muted)">Use your account to access TechKart, AgriMart, and the shared support assistant.</div>
        </div>
      </section>
    </div>
  )
}
