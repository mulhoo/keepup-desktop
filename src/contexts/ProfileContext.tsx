import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { LinkedAccount } from '@/api/linkedAccounts'
import { api } from '@/api/client'

// key format: null = base account, "linked-{id}" = a linked account by id
const STORAGE_KEY = 'keepup_default_profile_key'

interface ProfileContextValue {
  activeProfile: LinkedAccount | null
  defaultKey: string | null
  switchToProfile: (account: LinkedAccount | null) => void
  setDefaultKey: (key: string | null) => void
  resetProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<LinkedAccount | null>(null)
  const [defaultKey, setDefaultKeyState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY) ?? null
  )

  function setDefaultKey(key: string | null) {
    setDefaultKeyState(key)
    if (key === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, key)
    }
    api.patch('/demo/me/preferences', { preferences: { default_district_key: key ?? '' } }).catch(() => {})
  }

  const resetProfile = useCallback(() => {
    setActiveProfile(null)
    setDefaultKeyState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <ProfileContext.Provider value={{ activeProfile, defaultKey, switchToProfile: setActiveProfile, setDefaultKey, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

export function linkedAccountKey(account: LinkedAccount): string {
  return `linked-${account.id}`
}
