import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getCurrentUser } from '@/api/auth'
import type { SessionUser } from '@/api/auth'
import { DEMO_MODE, getDemoToken } from '@/api/client'

interface AuthState {
  user: SessionUser | null
  demoRole: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: SessionUser, demoRole?: string) => void
  logout: () => void
  refresh: () => Promise<void>
  isAuthenticated: boolean
  effectiveRole: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, demoRole: null, isLoading: true })

  useEffect(() => {
    if (DEMO_MODE && !getDemoToken()) {
      setState({ user: null, demoRole: null, isLoading: false })
      return
    }
    getCurrentUser()
      .then(({ user }) => setState({ user, demoRole: null, isLoading: false }))
      .catch(() => setState({ user: null, demoRole: null, isLoading: false }))
  }, [])

  const login = useCallback((user: SessionUser, demoRole?: string) => {
    setState({ user, demoRole: demoRole ?? null, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, demoRole: null, isLoading: false })
  }, [])

  const refresh = useCallback(async () => {
    const { user } = await getCurrentUser()
    setState(prev => ({ ...prev, user }))
  }, [])

  const effectiveRole = state.demoRole ?? state.user?.managing_role ?? null

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh, isAuthenticated: !!state.user, effectiveRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
