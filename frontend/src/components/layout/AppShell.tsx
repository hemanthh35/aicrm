import { useState, type CSSProperties, type FormEvent } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Grid2x2, ShoppingCart, Sprout, Repeat, UserCircle, Package, Search, Leaf, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { NotificationBell } from '@/components/NotificationBell'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { domain, logout, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAgri = domain === 'agriculture'
  const [navQuery, setNavQuery] = useState('')
  const searchPath = isAgri ? '/agriculture/shop' : '/ecommerce/categories'

  const submitNavSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(`${searchPath}?search=${encodeURIComponent(navQuery.trim())}`)
  }

  const nav = isAgri
    ? [
        { to: '/agriculture', icon: Home, label: t('shell.overview') },
        { to: '/agriculture/crops', icon: Sprout, label: t('shell.myCrops') },
        { to: '/agriculture/shop', icon: Grid2x2, label: t('nav.shop') },
        { to: '/orders', icon: Package, label: t('nav.orders') },
        { to: '/cart', icon: ShoppingCart, label: t('shell.basket') },
      ]
    : [
        { to: '/ecommerce', icon: Home, label: t('shell.overview') },
        { to: '/ecommerce/categories', icon: Grid2x2, label: t('shell.discover') },
        { to: '/orders', icon: Package, label: t('nav.orders') },
        { to: '/cart', icon: ShoppingCart, label: t('shell.basket') },
      ]

  const homeTo = isAgri ? '/agriculture' : '/ecommerce'
  const brandName = isAgri ? 'AgriMart' : 'TechKart'
  const themeOverride = isAgri ? ({
    '--color-ecom-primary': 'var(--color-agri-primary)',
    '--color-ecom-primary-hover': 'var(--color-agri-primary-hover)',
    '--color-ecom-glow': 'var(--color-agri-glow)',
  } as CSSProperties) : undefined

  return (
    <div className="min-h-screen bg-(--color-bg)" style={themeOverride}>
      <div className="border-b border-(--color-border) bg-(--color-accent-lime) px-5 py-2 text-center font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.14em] text-(--color-text)">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-(--color-text)" />
        {isAgri ? t('shell.agriSignal') : t('shell.techSignal')}
      </div>

      <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-bg)/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 overflow-hidden px-4 py-4 sm:px-6 lg:px-8 2xl:px-10">
          <Link to={homeTo} className="flex shrink-0 items-center gap-3">
            <BrandIcon agri={isAgri} />
            <span className="text-[1.05rem] font-bold tracking-[-0.04em]">{brandName}</span>
            <span className="hidden rounded-full border border-(--color-border) px-2 py-1 font-(family-name:--font-mono) text-[9px] uppercase tracking-[0.14em] text-(--color-muted) lg:inline">
              {isAgri ? t('shell.field') : t('shell.signal')}
            </span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-0 xl:flex 2xl:gap-0.5">
            {nav.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === homeTo} className={({ isActive }) => cn('flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-2 text-xs font-semibold transition-colors xl:px-2.5 2xl:gap-1.5 2xl:px-3.5 2xl:text-sm', isActive ? 'bg-(--color-text) text-white' : 'text-(--color-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)')}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 xl:gap-2">
            <form onSubmit={submitNavSearch} className="hidden h-10 w-[11rem] flex-none items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 text-xs text-(--color-muted) transition-colors focus-within:border-(--color-ecom-primary)/45 focus-within:ring-4 focus-within:ring-(--color-accent-lime)/20 hover:border-(--color-text)/30 sm:flex xl:w-[14rem] 2xl:w-[18rem]">
              <Search size={15} className="flex-shrink-0" />
              <input type="search" value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder={t('shell.searchAnything')} aria-label={t('shell.searchAnything')} autoComplete="off" className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--color-muted)" />
              <kbd className="hidden flex-none rounded bg-(--color-surface-2) px-1.5 py-0.5 font-(family-name:--font-mono) text-[9px] md:inline">⌘ K</kbd>
            </form>

            {user?.role === 'admin' && (
              <button onClick={() => navigate(isAgri ? '/agri-admin' : '/admin')} className="hidden h-10 min-w-[7.5rem] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-semibold text-(--color-muted) transition-colors hover:border-(--color-text)/30 hover:text-(--color-text) md:flex xl:min-w-[8.5rem] xl:px-3 2xl:min-w-[10.5rem] 2xl:gap-2 2xl:px-4 2xl:text-xs" title={t('shell.adminPanel')}>
                <LayoutDashboard size={14} />
                <span className="whitespace-nowrap">{t('shell.adminPanel')}</span>
              </button>
            )}

            <button onClick={() => navigate('/domain')} className="hidden h-10 min-w-[8.5rem] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-semibold text-(--color-muted) transition-colors hover:border-(--color-text)/30 hover:text-(--color-text) md:flex xl:min-w-[9.5rem] xl:px-3 2xl:min-w-[12.5rem] 2xl:gap-2 2xl:px-4 2xl:text-xs" title={t('shell.switchPlatform')}>
              <Repeat size={14} />
              <span className="whitespace-nowrap">{t('shell.switchPlatform')}</span>
            </button>
            <NotificationBell userId={user?.id} domain={domain ?? undefined} />
            <button onClick={() => navigate('/profile')} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-(--color-text) text-white" title={t('common.profile')}><UserCircle size={18} /></button>
            <button onClick={() => { logout(); navigate('/') }} className="hidden h-10 w-10 flex-none items-center justify-center rounded-full border border-(--color-border) text-(--color-muted) hover:text-(--color-danger) sm:flex" title={t('common.logout')}><LogOut size={15} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto min-h-[calc(100vh-108px)] w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-8 md:pb-12 lg:px-12 lg:pt-8"><Outlet /></div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 overflow-x-auto border-t border-(--color-border) bg-(--color-surface)/95 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex min-w-max max-w-[680px] items-center justify-center gap-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === homeTo} className={({ isActive }) => cn('flex min-w-[54px] flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] font-semibold', isActive ? 'text-(--color-text)' : 'text-(--color-muted)')}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button onClick={() => navigate('/domain')} className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] font-semibold text-(--color-muted)">
            <Repeat size={18} />
            {t('shell.switchShort')}
          </button>
        </div>
      </nav>
    </div>
  )
}

function BrandIcon({ agri = false }: { agri?: boolean }) {
  return <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${agri ? 'bg-(--color-agri-primary)' : 'bg-(--color-text)'}`}>{agri ? <Leaf size={17} className="text-(--color-accent-lime)" /> : <><span className="absolute h-3 w-3 -translate-x-0.5 rotate-[-28deg] rounded-full border-[3px] border-(--color-accent-lime) border-r-transparent" /><span className="absolute h-3 w-3 translate-x-1 rotate-[-28deg] rounded-full border-[3px] border-white border-l-transparent" /><span className="absolute right-[19%] top-[20%] h-1.5 w-1.5 rounded-full bg-(--color-accent-lime)" /></>}</span>
}
