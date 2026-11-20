// Text effects (after React Bits' DecryptedText and ScrollReveal, rewritten without dependencies).
import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz·•◦∘○◌'

// Letters scramble, then settle left to right into the real text.
export function Decrypt({ text, as: Tag = 'span', className = '', duration = 900, start = true }) {
  const [out, setOut] = useState(start ? scramble(text, 0) : text)
  useEffect(() => {
    if (!start) { setOut(text); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOut(text); return }
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      setOut(scramble(text, p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, start, duration])
  return <Tag className={`decrypt ${className}`} aria-label={text}><span aria-hidden="true">{out}</span></Tag>
}
function scramble(text, p) {
  const settled = Math.floor(text.length * p)
  let s = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    s += i < settled || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]
  }
  return s
}

// Words start dim and light up one by one as the paragraph scrolls through the middle of the screen.
export function ScrollLight({ children, className = '' }) {
  const ref = useRef(null)
  const words = String(children).split(/(\s+)/)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const spans = [...el.querySelectorAll('.sl-w')]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { spans.forEach((s) => s.style.setProperty('--lit', 1)); return }
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.35)))
      const n = spans.length
      spans.forEach((s, i) => s.style.setProperty('--lit', Math.min(1, Math.max(0, p * n * 1.15 - i))))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [children])
  return (
    <p ref={ref} className={`scroll-light ${className}`}>
      {words.map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} className="sl-w">{w}</span>))}
    </p>
  )
}
