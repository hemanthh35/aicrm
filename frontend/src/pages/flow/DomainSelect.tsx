import { useState } from 'react'
import { ArrowRight, Check, Leaf, LogOut, ShoppingBag, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Domain = 'ecommerce' | 'agriculture'

export default function DomainSelect() {
  const { domain, setDomain, logout, user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Domain>(domain ?? 'ecommerce')

  const continueToPlatform = () => {
    setDomain(selected)
    navigate(selected === 'ecommerce' ? '/ecommerce' : '/agriculture')
  }

  return <div className="app-page min-h-screen"><header className="mx-auto flex max-w-[1200px] items-center justify-end px-5 py-6 sm:px-8"><button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 text-xs font-semibold text-(--color-muted) hover:text-(--color-text)"><LogOut size={14} /> Log out</button></header><main className="mx-auto flex max-w-[1200px] flex-col px-5 pb-16 pt-10 sm:px-8 lg:pt-16"><div className="max-w-xl"><div className="eyebrow flex items-center gap-3"><Sparkles size={14} className="text-(--color-ecom-primary)" /> Switch platform</div><h1 className="display-heading mt-5 text-5xl leading-[0.95] sm:text-7xl">Where do you want to go today?</h1><p className="mt-6 max-w-lg text-base leading-7 text-(--color-muted)">{user?.name ? `Hi ${user.name.split(' ')[0]}, choose the workspace that fits the moment.` : 'Choose the workspace that fits the moment.'} You can switch between them anytime from the navigation.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-2"><PlatformCard selected={selected === 'ecommerce'} onClick={() => setSelected('ecommerce')} icon={ShoppingBag} eyebrow="For modern commerce" title="TechKart" copy="Discover devices, compare options, manage your basket, and get support with the full context of your customer journey." bullets={['Personalized product picks', 'Orders, basket, and support', 'Voice and text assistant']} /><PlatformCard selected={selected === 'agriculture'} onClick={() => setSelected('agriculture')} icon={Leaf} eyebrow="For the field" title="AgriMart" copy="Get practical crop guidance, browse farming essentials, and stay connected to the advice that helps work move forward." bullets={['My crops and recommendations', 'Farming products and orders', 'Expert advice in your language']} agri /></div><div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Button onClick={continueToPlatform} className="button-lime h-12 px-6">Continue to {selected === 'ecommerce' ? 'TechKart' : 'AgriMart'} <ArrowRight size={16} /></Button><p className="text-xs text-(--color-muted)">Your current choice is saved for this session.</p></div></main></div>
}

function PlatformCard({ selected, onClick, icon: Icon, eyebrow, title, copy, bullets, agri = false }: { selected: boolean; onClick: () => void; icon: typeof ShoppingBag; eyebrow: string; title: string; copy: string; bullets: string[]; agri?: boolean }) { return <button onClick={onClick} className={cn('group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all sm:p-8', selected ? 'border-(--color-text) bg-(--color-surface) shadow-[0_20px_45px_-28px_rgba(25,61,42,0.5)]' : 'border-(--color-border) bg-(--color-surface-2) hover:-translate-y-0.5 hover:border-(--color-text)/35')}><div className={`absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl ${agri ? 'bg-[#a8d47f]/25' : 'bg-(--color-accent-lime)/30'}`} /><div className="relative"><div className="flex items-start justify-between"><span className={cn('flex h-12 w-12 items-center justify-center rounded-full', agri ? 'bg-(--color-agri-primary) text-white' : 'bg-(--color-text) text-(--color-accent-lime)')}><Icon size={20} /></span><span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', selected ? 'border-(--color-text) bg-(--color-accent-lime) text-(--color-text)' : 'border-(--color-border) text-transparent')}><Check size={14} /></span></div><p className="eyebrow mt-10">{eyebrow}</p><h2 className="display-heading mt-2 text-5xl">{title}</h2><p className="mt-4 max-w-md text-sm leading-6 text-(--color-muted)">{copy}</p><div className="mt-7 grid gap-2 sm:grid-cols-3">{bullets.map((bullet) => <span key={bullet} className="flex items-center gap-2 text-xs font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-(--color-accent-lime)" />{bullet}</span>)}</div></div></button> }
