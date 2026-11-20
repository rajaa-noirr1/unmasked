// A photo in the tests. If the photo has a `veil`, the face is blurred out until `revealed`, so the
// body has to be read on its own first. `fallback` is shown while the photo is missing (the context
// test keeps its silhouettes until photos arrive); `fill` crops the photo to fill its frame.
import { useState } from 'react'
import { useImage } from '../lib/useImage'
import { useT } from '../i18n'

export default function Photo({ image, revealed = false, alt = 'A photo of a person', className = '', fallback = null, fill = false }) {
  const t = useT()
  const img = useImage(image.src)
  const [shown, setShown] = useState(false)
  if (img.status === 'missing' && fallback) return fallback
  if (img.status !== 'ok') {
    return (
      <div className={`photo ${img.status === 'missing' ? 'is-missing' : 'is-loading'} ${fill ? 'fill' : ''} ${className}`}>
        {img.status === 'missing' && <span className="eyestrip-need ui">{t(['Photo needed', 'وێنە پێویستە'])} <code>{image.file}</code></span>}
      </div>
    )
  }
  const veil = fill ? null : image.veil
  return (
    <figure className={`photo ${shown ? 'loaded' : ''} ${revealed ? 'revealed' : ''} ${fill ? 'fill' : ''} ${className}`} style={fill ? undefined : { aspectRatio: `${img.w} / ${img.h}`, width: `min(100%, ${(72 * img.w) / img.h}vh)` }}>
      <img src={img.src} alt={alt} onLoad={() => setShown(true)} ref={(el) => { if (el?.complete) setShown(true) }} draggable="false" />
      {veil && (
        <span className="photo-veil" aria-hidden="true"
          style={{ left: `${veil.x * 100}%`, top: `${veil.y * 100}%`, width: `${veil.r * 200}%` }} />
      )}
    </figure>
  )
}
