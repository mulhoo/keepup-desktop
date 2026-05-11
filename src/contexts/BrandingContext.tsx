import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface SportBranding { icon_url?: string; banner_url?: string }
export interface SchoolBranding { icon_url?: string; banner_url?: string }

interface BrandingContextValue {
  getSportBranding: (id: number) => SportBranding
  setSportBranding: (id: number, b: SportBranding) => void
  schoolBranding: SchoolBranding
  setSchoolBranding: (b: SchoolBranding) => void
  resetBranding: () => void
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [sportBrandings, setSportBrandings] = useState<Record<number, SportBranding>>({})
  const [schoolBranding, setSchoolBranding] = useState<SchoolBranding>({})

  const getSportBranding = (id: number): SportBranding => sportBrandings[id] ?? {}
  const setSportBranding = (id: number, b: SportBranding) =>
    setSportBrandings(prev => ({ ...prev, [id]: { ...prev[id], ...b } }))

  const resetBranding = useCallback(() => {
    setSportBrandings({})
    setSchoolBranding({})
  }, [])

  return (
    <BrandingContext.Provider value={{ getSportBranding, setSportBranding, schoolBranding, setSchoolBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider')
  return ctx
}
