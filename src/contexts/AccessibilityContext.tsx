import { createContext, useContext, useState, useEffect } from 'react'

export type FontSize = 'small' | 'medium' | 'large'

export interface AccessibilityPrefs {
  font_size: FontSize
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  font_size: 'medium',
}

const FONT_SIZE_PX: Record<FontSize, string> = {
  small:  '13px',
  medium: '15px',
  large:  '17px',
}

const STORAGE_KEY = 'keepup_accessibility'

type AccessibilityContextType = {
  prefs: AccessibilityPrefs
  setFontSize: (size: FontSize) => void
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefs: DEFAULT_PREFS,
  setFontSize: () => {},
})

function loadPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: AccessibilityPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(loadPrefs)

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_PX[prefs.font_size]
  }, [prefs.font_size])

  function setFontSize(font_size: FontSize) {
    const next = { ...prefs, font_size }
    setPrefs(next)
    savePrefs(next)
  }

  return (
    <AccessibilityContext.Provider value={{ prefs, setFontSize }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  return useContext(AccessibilityContext)
}
