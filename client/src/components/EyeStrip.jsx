// A strip of face showing only the eyes, cut from a full photo. When `widened`, the frame grows and
// pulls back until the whole frame is visible: the answer arrives as context. Photos are shown as
// they are, in colour, with no filter.
import { useLayoutEffect, useRef, useState } from 'react'
import { useImage } from '../lib/useImage'
import { useT } from '../i18n'

// a guess for a close-up TV frame, until the real crop is measured (data/photos.js)
const DEFAULT_CROP = { x: 0.25, y: 0.3, w: 0.5, h: 0.16 }

export default function EyeStrip({ image, widened = false, className = '', alt = 'A pair of eyes' }) {
  const t = useT()
  const box = useRef(null)
  const [W, setW] = useState(0)
  const [shown, setShown] = useState(false)
  const img = useImage(image.src)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (img.status !== 'ok') {
    return (
      <div ref={box} className={`eyestrip ${img.status === 'missing' ? 'is-missing' : 'is-loading'} ${widened ? 'widened' : ''} ${className}`} style={{ height: W ? W * (widened ? 0.56 : 0.2) : 0 }}>
        {img.status === 'missing' && <span className="eyestrip-need ui">{t(['Photo needed', 'وێنە پێویستە'])} <code>{image.file}</code></span>}
      </div>
    )
  }

  const { w: iw, h: ih } = img
  const crop = image.crop || DEFAULT_CROP
  const stripH = W ? (W * (crop.h * ih)) / (crop.w * iw) : 0
  const fullH = W ? Math.min((W * ih) / iw, 640) : 0
  let tf
  if (!W) tf = 'scale(0.0001)'
  else if (!widened) {
    const s = W / (crop.w * iw)
    tf = `translate(${-crop.x * iw * s}px, ${-crop.y * ih * s}px) scale(${s})`
  } else {
    // the whole frame (a tall photo is cropped around the face instead)
    const s = Math.max(W / iw, fullH / ih)
    const fx = crop.x + crop.w / 2, fy = crop.y + crop.h / 2
    const tx = Math.min(0, Math.max(W - iw * s, W / 2 - fx * iw * s))
    const ty = Math.min(0, Math.max(fullH - ih * s, fullH / 2 - fy * ih * s))
    tf = `translate(${tx}px, ${ty}px) scale(${s})`
  }

  return (
    <div ref={box} className={`eyestrip ${widened ? 'widened' : ''} ${shown ? 'loaded' : ''} ${className}`} style={{ height: widened ? fullH : stripH }}>
      <img src={img.src} alt={widened ? alt.replace('A pair of eyes', 'The whole face') : alt} width={iw} height={ih}
        style={{ width: iw, height: ih, transform: tf }} onLoad={() => setShown(true)} ref={(el) => { if (el?.complete) setShown(true) }} draggable="false" />
      <span className="eyestrip-scan" aria-hidden="true" />
    </div>
  )
}
