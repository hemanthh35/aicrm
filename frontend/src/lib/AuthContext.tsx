import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import i18n from '@/lib/i18n'
import { api, type AuthUser, type TokenResponse } from '@/lib/api'

const DOMAIN_KEY = 'techkart_domain'

type Domain = 'ecommerce' | 'agriculture'

/** Domain is determined by account type, not a free user choice: customers shop TechKart, farmers use AgriMart. */
export function domainForRole(role: string | undefined): Domain | null {
  if (role === 'customer') return 'ecommerce'
  if (role === 'farmer') return 'agriculture'
  return null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  domain: Domain | null
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (data: { name: string; email: string; password: string; phone?: string; city?: string; role: 'customer' | 'farmer' }) => Promise<AuthUser>
  logout: () => void
  setLanguage: (language: 'en' | 'te' | 'hi') => Promise<void>
  setDomain: (domain: Domain) => void
  updateProfile: (data: { name?: string; phone?: string; city?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [domain, setDomainState] = useState<Domain | null>(() => sessionStorage.getItem(DOMAIN_KEY) as Domain | null)

  useEffect(() => {
    api.get<AuthUser>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.language) i18n.changeLanguage(user.language)
  }, [user?.language])

  const login = async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  const signup = async (payload: { name: string; email: string; password: string; phone?: string; city?: string; role: 'customer' | 'farmer' }) => {
    const { data } = await api.post<TokenResponse>('/auth/signup', payload)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    void api.post('/auth/logout')
    sessionStorage.removeItem(DOMAIN_KEY)
    setUser(null)
    setDomainState(null)
  }

  const setLanguage = async (language: 'en' | 'te' | 'hi') => {
    const { data } = await api.put<AuthUser>('/auth/me', { language })
    window.localStorage.setItem('pulse_language', language)
    setUser(data)
  }

  const setDomain = (d: Domain) => {
    sessionStorage.setItem(DOMAIN_KEY, d)
    setDomainState(d)
  }

  const updateProfile = async (payload: { name?: string; phone?: string; city?: string }) => {
    const { data } = await api.put<AuthUser>('/auth/me/profile', payload)
    setUser(data)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword })
  }

  return (
    <AuthContext.Provider value={{ user, loading, domain, login, signup, logout, setLanguage, setDomain, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
