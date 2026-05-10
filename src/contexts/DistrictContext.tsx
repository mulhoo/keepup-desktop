import { createContext, useContext, useMemo } from 'react'
import { parseDistrictSubdomain } from '@/lib/subdomain'

interface DistrictContextValue {
  subdomain: string | null
}

const DistrictContext = createContext<DistrictContextValue>({ subdomain: null })

export function DistrictProvider({ children }: { children: React.ReactNode }) {
  const subdomain = useMemo(parseDistrictSubdomain, [])
  return (
    <DistrictContext.Provider value={{ subdomain }}>
      {children}
    </DistrictContext.Provider>
  )
}

export function useDistrict() {
  return useContext(DistrictContext)
}
