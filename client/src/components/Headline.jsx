// Headlines that unmask themselves. The letters come out of a blur one after another; then they swell in
// weight and warm to gold as the pointer passes near them, and every few seconds a slow wave of light
// crosses the line. After React Bits' BlurText and VariableProximity, rewritten without dependencies.
// Kurdish (Arabic script) is split by word, never by letter, so the letters stay joined.
import { useEffect, useRef } from 'react'

const ARABIC = /[؀-ۿ]/
const CYCLE = 8000 // ms between waves
const CROSS = 2600 // ms a wave takes to cross

export default function Headline({ text, as: Tag = 'h1', className = '', delay = 0, wave = true }) {
  const ref = useRef(null)
  const lines = Array.isArray(text) ? text : [text]
  const label = lines.join(' ')
  const byWord = ARABIC.test(label)
  const step = byWord ? 0.11 : 0.04
  let n = 0
  const content = lines.map((line, li) => {
    const words = line.split(' ')
    return (
      <span className="hl-line" key={li}>
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="hl-w">
              {byWord
                ? <span className="hl-u" style={{ '--i': n++ }}>{word}</span>
                : [...word].map((ch, ci) => <span className="hl-u" key={ci} style={{ '--i': n++ }}>{ch}</span>)}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    )
  })
  const count = n

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const units = [...el.querySelectorAll('.hl-u')]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = false, raf = 0, t0 = 0, centers = [], width = 1, radius = 120
    let px = -1e5, py = -1e5
    const last = units.map(() => 0)

    // centres at rest, relative to the headline (offsets ignore the entry transforms and the swelling)
    const measure = () => {
      centers = units.map((u) => [u.offsetLeft + u.offsetWidth / 2, u.offsetTop + u.offsetHeight / 2])
      width = el.offsetWidth || 1
      radius = Math.max(90, parseFloat(getComputedStyle(el).fontSize) * 1.6)
    }
    const entry = (delay + count * step + 1.2) * 1000

    const tick = (now) => {
      raf = 0
      if (!visible) return
      const r = el.getBoundingClientRect()
      const since = now - t0 - entry
      const ph = wave && since > 0 ? (since % CYCLE) / CROSS : 9 // 0…1 while a wave is crossing
      const band = Math.max(120, width * 0.18)
      for (let i = 0; i < units.length; i++) {
        const [cx, cy] = centers[i] || [0, 0]
        let f = Math.max(0, 1 - Math.hypot(px - r.left - cx, py - r.top - cy) / radius)
        f = f * f * (3 - 2 * f)
        if (ph <= 1) {
          const pos = ph * (width + 2 * band) - band
          const w = Math.max(0, 1 - Math.abs((byWord ? width - cx : cx) - pos) / band)
          f = Math.max(f, w * w * 0.5)
        }
        if (Math.abs(f - last[i]) > 0.004) { units[i].style.setProperty('--p', f.toFixed(3)); last[i] = f }
      }
      raf = requestAnimationFrame(tick)
    }
    const kick = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(tick) }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !el.classList.contains('go')) { el.classList.add('go'); t0 = performance.now() }
      kick()
    }, { threshold: 0.15 })
    io.observe(el)
    if (reduce) return () => io.disconnect()

    measure()
    document.fonts?.ready.then(measure)
    const onMove = (e) => { px = e.clientX; py = e.clientY; kick() }
    const onLeave = () => { px = py = -1e5 }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
    }
  }, [label, delay, count, step, byWord, wave])

  return (
    <Tag ref={ref} className={`headline ${className}`} aria-label={label} style={{ '--d0': `${delay}s`, '--step': `${step}s` }} key={label}>
      <span aria-hidden="true">{content}</span>
    </Tag>
  )
}
