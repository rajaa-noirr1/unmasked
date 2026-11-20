// Two languages: English and Kurdish (Sorani, written right to left). Page text sits beside its
// translation as a pair: t(['English', 'کوردی']). Longer content (the Map, the tests, the Mirror)
// is translated in i18n/ckb/ and merged by id, see i18n/data.js.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const LANGS = {
  en: { label: 'English', short: 'EN', dir: 'ltr', locale: 'en' },
  ckb: { label: 'کوردی', short: 'کو', dir: 'rtl', locale: 'ckb-IQ', digits: 'arab' },
}

const LangContext = createContext({ lang: 'en', setLang: () => {} })

function initialLang() {
  try {
    const saved = localStorage.getItem('unmasked:lang')
    if (saved && LANGS[saved]) return saved
  } catch { /* storage blocked */ }
  return 'en'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang)
  useEffect(() => {
    const html = document.documentElement
    html.lang = lang
    html.dir = LANGS[lang].dir
    try { localStorage.setItem('unmasked:lang', lang) } catch { /* storage blocked */ }
  }, [lang])
  const value = useMemo(() => ({ lang, setLang }), [lang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

// t(['English', 'Kurdish']) → the current language. Missing Kurdish falls back to English.
// n(5) → 5 or ٥, in the current language's digits.
export function useT() {
  const { lang } = useLang()
  return useMemo(() => {
    const fmt = new Intl.NumberFormat(LANGS[lang].locale, LANGS[lang].digits ? { numberingSystem: LANGS[lang].digits } : {})
    const t = (pair) => (Array.isArray(pair) ? (lang === 'ckb' && pair[1] ? pair[1] : pair[0]) : pair)
    t.lang = lang
    t.n = (x) => fmt.format(x)
    return t
  }, [lang])
}
