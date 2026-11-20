// Loads a photo from public/images by its name, trying the usual extensions, and reports its size.
// A missing photo is a normal state while the folders are being filled, not an error.
import { useEffect, useState } from 'react'

const EXTS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG']
const found = new Map()

function probe(base) {
  if (found.has(base)) return found.get(base)
  const urls = /\.[a-z]{3,4}$/i.test(base) ? [base] : EXTS.map((e) => `${base}.${e}`)
  const p = new Promise((resolve) => {
    const tryAt = (i) => {
      if (i >= urls.length) return resolve(null)
      const img = new Image()
      img.onload = () => resolve({ src: urls[i], w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => tryAt(i + 1)
      img.src = urls[i]
    }
    tryAt(0)
  })
  found.set(base, p)
  return p
}

export function useImage(base) {
  const [state, setState] = useState({ status: 'loading' })
  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    probe(base).then((r) => { if (alive) setState(r ? { status: 'ok', ...r } : { status: 'missing' }) })
    return () => { alive = false }
  }, [base])
  return state
}
