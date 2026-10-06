import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Grid2x2, ShoppingBag, Users, Boxes, Tag, Star, CreditCard, FileBarChart, Image, Headset, Settings, BookOpen, MessageSquare, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminTopbar } from '@/components/layout/AdminTopbar'

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Grid2x2, label: 'Categories' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/admin/deals', icon: Tag, label: 'Deals & offers' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/admin/banners', icon: Image, label: 'Banners' },
  { to: '/admin/knowledge-base', icon: BookOpen, label: 'Knowledge base' },
  { to: '/admin/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/admin/support', icon: Headset, label: 'Support tickets' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function AdminShell() {
  return <AdminFrame nav={NAV} storeLink="/ecommerce" storeDomain="ecommerce" storeLabel="View TechKart" ticketsLink="/admin/support" ticketRole="customer" brand="TechKart" descriptor="Commerce operations" />
}

export function AdminFrame({ nav, storeLink, storeDomain, storeLabel, ticketsLink, ticketRole, brand, descriptor, agri = false }: { nav: typeof NAV; storeLink: string; storeDomain: 'ecommerce' | 'agriculture'; storeLabel: string; ticketsLink: string; ticketRole: 'customer' | 'farmer'; brand: string; descriptor: string; agri?: boolean }) {
  const primary = agri ? 'bg-(--color-agri-primary)' : 'bg-(--color-text)'
  return <div className="min-h-screen bg-(--color-bg)"><aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-(--color-border) bg-(--color-surface) lg:flex"><div className="flex items-center gap-3 px-6 py-6"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${primary} text-(--color-accent-lime)`}>{agri ? <span className="text-lg">✳</span> : <ShoppingCart size={18} />}</span><div><p className="text-base font-bold tracking-[-0.04em]">{brand}</p><p className="font-(family-name:--font-mono) text-[9px] uppercase tracking-[0.12em] text-(--color-muted)">{descriptor}</p></div></div><div className="mx-5 mb-4 border-t border-(--color-border)" /><nav className="flex-1 space-y-0.5 overflow-y-auto px-3">{nav.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end={to === (agri ? '/agri-admin' : '/admin')} className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors', isActive ? `${primary} text-white` : 'text-(--color-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)')}><Icon size={16} />{label}</NavLink>)}</nav><div className="m-4 rounded-2xl bg-(--color-surface-2) p-4"><div className="flex items-center gap-2"><span className="lime-dot" /><span className="text-xs font-semibold">All systems healthy</span></div><p className="mt-2 text-[11px] leading-4 text-(--color-muted)">All systems are synced and ready for the next customer.</p></div></aside><main className="min-h-screen lg:pl-[260px]"><AdminTopbar storeLink={storeLink} storeDomain={storeDomain} storeLabel={storeLabel} ticketsLink={ticketsLink} ticketRole={ticketRole} /><div className="lg:hidden border-b border-(--color-border) bg-(--color-surface) px-5 py-4"><p className="text-sm font-bold">{brand} <span className="font-normal text-(--color-muted)">/ {descriptor}</span></p></div><Outlet /></main></div>
}
