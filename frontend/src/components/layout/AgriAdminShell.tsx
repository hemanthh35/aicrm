import type { CSSProperties } from 'react'
import { AlertTriangle, BookOpen, FileBarChart, Grid2x2, Headset, Landmark, LayoutDashboard, MessageSquare, Package, Settings, ShoppingBag, Sprout, Users, Brain } from 'lucide-react'
import { AdminFrame } from '@/components/layout/AdminShell'

const NAV = [
  { to: '/agri-admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/agri-admin/farmers', icon: Users, label: 'Farmers' },
  { to: '/agri-admin/crops', icon: Sprout, label: 'Crops' },
  { to: '/agri-admin/products', icon: Package, label: 'Products' },
  { to: '/agri-admin/categories', icon: Grid2x2, label: 'Categories' },
  { to: '/agri-admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/agri-admin/crop-issues', icon: AlertTriangle, label: 'Crop issues' },
  { to: '/agri-admin/advisories', icon: BookOpen, label: 'Advisories & tips' },
  { to: '/agri-admin/schemes', icon: Landmark, label: 'Schemes & announcements' },
  { to: '/agri-admin/knowledge-base', icon: Brain, label: 'Knowledge base' },
  { to: '/agri-admin/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/agri-admin/support', icon: Headset, label: 'Support tickets' },
  { to: '/agri-admin/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/agri-admin/settings', icon: Settings, label: 'Settings' },
]

const themeOverride = { '--color-ecom-primary': 'var(--color-agri-primary)', '--color-ecom-primary-hover': 'var(--color-agri-primary-hover)', '--color-ecom-glow': 'var(--color-agri-glow)' } as CSSProperties

export function AgriAdminShell() {
  return <div style={themeOverride}><AdminFrame nav={NAV} storeLink="/agriculture" storeDomain="agriculture" storeLabel="View AgriMart" ticketsLink="/agri-admin/support" ticketRole="farmer" brand="AgriMart" descriptor="Field operations" agri /></div>
}
