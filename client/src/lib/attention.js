// "Attention": a tiny shared signal that rises while the visitor points at something interactive.
// The hero eye listens to it: pupils widen with interest, as real ones do.
const listeners = new Set()
let level = 0

export function setAttention(v) {
  level = v
  for (const l of listeners) l(level)
}
export function onAttention(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const attention = () => level

// Pointer over a link or button → attention up. Installed once by the app.
export function watchInteractive() {
  const over = (e) => {
    const hit = e.target.closest?.('a, button, [data-attend]')
    setAttention(hit ? 1 : 0)
  }
  window.addEventListener('pointerover', over, { passive: true })
  return () => window.removeEventListener('pointerover', over)
}
