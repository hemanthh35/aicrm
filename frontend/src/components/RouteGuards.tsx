import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-(--color-muted)">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireDomain({ domain }: { domain: 'ecommerce' | 'agriculture' }) {
  const { domain: active } = useAuth()
  if (!active) return <Navigate to="/domain" replace />
  if (active !== domain) return <Navigate to={active === 'ecommerce' ? '/ecommerce' : '/agriculture'} replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-(--color-muted)">Loading...</div>
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />
  return <Outlet />
}
