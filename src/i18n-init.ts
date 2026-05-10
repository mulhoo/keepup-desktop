import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './translations/en.json'
import es from './translations/es.json'
import zh_CN from './translations/zh_CN.json'
import { getUserLanguage } from './lib/i18n'

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: getUserLanguage(),
  resources: { ...en, ...es, ...zh_CN },
  interpolation: {
    escapeValue: false,
  },
  returnEmptyString: false,
})

export default i18n
