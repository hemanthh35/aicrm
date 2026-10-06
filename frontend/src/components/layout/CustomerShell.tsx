import { Outlet, NavLink } from 'react-router-dom'
import { Home, Grid2x2, ShoppingCart, Headset } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/categories', icon: Grid2x2, label: 'Categories' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/support', icon: Headset, label: 'Support' },
]

export function CustomerShell() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-(--color-bg) pb-20">
      <Outlet />
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-(--color-border) bg-(--color-surface)/95 backdrop-blur">
        <div className="flex items-center justify-around py-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-(--color-ecom-primary)' : 'text-(--color-muted) hover:text-(--color-text)'
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
