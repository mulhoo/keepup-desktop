import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

export const SUPPORTED_LANGUAGES = ['en', 'es', 'zh_CN'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

const LANGUAGE_NAMES: Record<string, string> = {
  en:    'English',
  es:    'Español',
  zh_CN: '中文',
}

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? 'English'
}

export function getUserLanguage(): string {
  const params = new URLSearchParams(window.location.search)
  const param = params.get('language')
  if (param === 'es')    return 'es'
  if (param === 'en')    return 'en'
  if (param === 'zh_CN') return 'zh_CN'

  const browser = window.navigator.language
  if (browser.startsWith('es')) return 'es'
  if (browser.startsWith('zh')) return 'zh_CN'

  return 'en'
}

export function useTranslationHelpers() {
  const { t } = useTranslation()
  return {
    t,
    currentLanguage: i18n.language,
    isSpanish:  i18n.language === 'es',
    isChinese:  i18n.language === 'zh_CN',
    isEnglish:  i18n.language === 'en',
  }
}

export function useCurrentLanguage() {
  const { i18n: i18nInstance } = useTranslation()
  return {
    currentLanguage: i18nInstance.language,
    isSpanish:  i18nInstance.language === 'es',
    isChinese:  i18nInstance.language === 'zh_CN',
    isEnglish:  i18nInstance.language === 'en',
    setLanguage: (code: SupportedLanguage) => i18nInstance.changeLanguage(code),
  }
}
