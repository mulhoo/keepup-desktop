import { createContext, useContext, useState, useEffect } from 'react'

export type FontSize  = 'small' | 'default' | 'large'
export type ColorMode = 'light' | 'dark' | 'school'

export interface AccessibilityPrefs {
  font_size:  FontSize
  color_mode: ColorMode
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  font_size:  'default',
  color_mode: 'dark',
}

const FONT_SIZE_PX: Record<FontSize, string> = {
  small:   '15px',
  default: '17px',
  large:   '19px',
}

const VALID_SIZES      = new Set<FontSize>(['small', 'default', 'large'])
const VALID_COLOR_MODE = new Set<ColorMode>(['light', 'dark', 'school'])

const STORAGE_KEY = 'keepup_accessibility'

type AccessibilityContextType = {
  prefs:        AccessibilityPrefs
  setFontSize:  (size: FontSize)   => void
  setColorMode: (mode: ColorMode)  => void
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  prefs:        DEFAULT_PREFS,
  setFontSize:  () => {},
  setColorMode: () => {},
})

function loadPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    if (!VALID_SIZES.has(parsed.font_size))           parsed.font_size  = DEFAULT_PREFS.font_size
    if (!VALID_COLOR_MODE.has(parsed.color_mode))     parsed.color_mode = DEFAULT_PREFS.color_mode
    return { ...DEFAULT_PREFS, ...parsed }
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

  function setColorMode(color_mode: ColorMode) {
    const next = { ...prefs, color_mode }
    setPrefs(next)
    savePrefs(next)
  }

  return (
    <AccessibilityContext.Provider value={{ prefs, setFontSize, setColorMode }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  return useContext(AccessibilityContext)
}
