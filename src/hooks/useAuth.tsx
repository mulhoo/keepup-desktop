import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { clearToken } from '@/api/client'
import type { SessionUser } from '@/api/auth'

interface AuthState {
  user: SessionUser | null
  demoRole: string | null
}

interface AuthContextValue extends AuthState {
  login: (user: SessionUser, demoRole?: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, demoRole: null })

  const login = useCallback((user: SessionUser, demoRole?: string) => {
    setState({ user, demoRole: demoRole ?? null })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setState({ user: null, demoRole: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
