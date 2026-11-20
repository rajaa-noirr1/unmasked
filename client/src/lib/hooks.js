import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'

// Adds .in to every .rv inside the returned ref when it scrolls into view.
export function useReveal(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = root.querySelectorAll('.rv:not(.in)')
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

// a page title, given as one string or as a pair ['English', 'کوردی'] (see i18n)
export function useTitle(title) {
  const { lang } = useLang()
  const text = Array.isArray(title) ? (lang === 'ckb' ? title[1] : title[0]) : title
  useEffect(() => {
    document.title = text ? `${text} · Unmasked` : lang === 'ckb' ? 'Unmasked · ئەوەی جەستە ئاشکرای دەکات' : 'Unmasked · what the body gives away'
  }, [text, lang])
}

// Remembered in this browser only (front end, no accounts).
export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try { const v = localStorage.getItem(`unmasked:${key}`); return v ? JSON.parse(v) : initial } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(`unmasked:${key}`, JSON.stringify(value)) } catch { /* storage blocked */ }
  }, [key, value])
  return [value, setValue]
}

export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}
