// The Mirror's portrait: a real face with the muscles the Mirror reads, labelled like an anatomy plate.
// The photo is a warm black and white. Over it, a lens follows the pointer and unmasks the face in its
// true colour, lighting whichever muscle it passes over. Point at (or tap) a label to light it and read
// what that muscle does; `lit` lights a set of action units, e.g. the muscles of an expression being
// practised. `compact` drops the labels.
import { useEffect, useId, useRef, useState } from 'react'
import { UNITS } from '../data/mirror'
import { useData } from '../i18n/data'
import { useT } from '../i18n'
import { useMedia } from '../lib/hooks'
import { asset } from '../lib/asset'

export const PORTRAIT = asset('images/mirror/portrait.webp') // 800 × 1000
const CROP = { x: 150, y: 215, w: 500, h: 590 }
const SIDE = 280 // room for the labels on each side of the photo
const LENS = 96 // radius of the lens, in image pixels
const NEAR = 58 // how close the lens must come to a muscle to light it

// where each muscle sits on the portrait (image pixels), and which label row it uses
const ROW = (k) => 285 + k * 76
const PINS = [
  { au: 1, side: -1, row: ROW(0), at: [358, 350] },
  { au: 4, side: -1, row: ROW(1), at: [390, 386] },
  { au: 7, side: -1, row: ROW(2), at: [306, 424] },
  { au: 9, side: -1, row: ROW(3), at: [368, 472] },
  { au: 24, side: -1, row: ROW(4), at: [390, 576] },
  { au: 14, side: -1, row: ROW(5), at: [320, 580] },
  { au: 17, side: -1, row: ROW(6), at: [393, 642] },
  { au: 2, side: 1, row: ROW(0), at: [490, 354] },
  { au: 5, side: 1, row: ROW(1), at: [462, 399] },
  { au: 6, side: 1, row: ROW(2), at: [514, 424] },
  { au: 12, side: 1, row: ROW(3), at: [486, 515] },
  { au: 26, side: 1, row: ROW(4), at: [516, 572] },
  { au: 20, side: 1, row: ROW(5), at: [470, 584] },
  { au: 15, side: 1, row: ROW(6), at: [446, 612] },
]
const SHORT = { 9: 'Levator labii sup. alaeque nasi' }

export default function PhotoPlate({ lit = [], compact: forceCompact = false, className = '', caption = true }) {
  const t = useT()
  const id = useId().replace(/:/g, '')
  const local = useData().UNITS
  const narrow = useMedia('(max-width: 640px)')
  const compact = forceCompact || narrow
  const [hover, setHover] = useState(null) // a label being pointed at
  const [near, setNear] = useState(null) // the muscle under the lens
  const figRef = useRef(null)
  const svgRef = useRef(null)
  const maskRef = useRef(null)
  const ringRef = useRef(null)
  const lens = useRef({ x: 400, y: 450, tx: 400, ty: 450, s: 0, ts: 0, raf: 0 })
  const nearRef = useRef(null)
  const litSet = new Set(lit.map(Number))
  const focusAu = hover ?? near ?? (lit.length ? Number(lit[0]) : null)
  const info = focusAu != null ? { en: UNITS.find((u) => u.au === focusAu), local: local.find((u) => u.au === focusAu) } : null
  const view = compact ? `${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}` : `${CROP.x - SIDE} ${CROP.y} ${CROP.w + 2 * SIDE} ${CROP.h}`

  // the lens glides after the pointer and grows or shrinks; drawn straight into the SVG, no re-render
  const draw = () => {
    const L = lens.current
    L.raf = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const k = reduce ? 1 : 0.2
    L.x += (L.tx - L.x) * k
    L.y += (L.ty - L.y) * k
    L.s += (L.ts - L.s) * (reduce ? 1 : 0.14)
    const r = LENS * L.s
    maskRef.current?.setAttribute('cx', L.x.toFixed(1))
    maskRef.current?.setAttribute('cy', L.y.toFixed(1))
    maskRef.current?.setAttribute('r', r.toFixed(1))
    ringRef.current?.setAttribute('transform', `translate(${L.x.toFixed(1)} ${L.y.toFixed(1)}) scale(${Math.max(0.001, L.s).toFixed(3)})`)
    if (Math.abs(L.tx - L.x) + Math.abs(L.ty - L.y) > 0.2 || Math.abs(L.ts - L.s) > 0.004) L.raf = requestAnimationFrame(draw)
  }
  const kick = () => { if (!lens.current.raf) lens.current.raf = requestAnimationFrame(draw) }
  useEffect(() => () => cancelAnimationFrame(lens.current.raf), [])

  const setNearAu = (au) => { if (nearRef.current !== au) { nearRef.current = au; setNear(au) } }
  const onMove = (e) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const L = lens.current
    const inside = p.x > CROP.x && p.x < CROP.x + CROP.w && p.y > CROP.y && p.y < CROP.y + CROP.h
    if (inside) {
      if (L.s < 0.02) { L.x = p.x; L.y = p.y } // appear where the pointer is, not slide in from far away
      L.tx = p.x; L.ty = p.y; L.ts = 1
      let best = null, bestD = NEAR
      for (const pin of PINS) {
        const d = Math.hypot(pin.at[0] - p.x, pin.at[1] - p.y)
        if (d < bestD) { bestD = d; best = pin.au }
      }
      setNearAu(best)
    } else {
      L.ts = 0
      setNearAu(null)
    }
    figRef.current?.classList.toggle('is-lens', inside)
    kick()
  }
  const onLeave = () => {
    lens.current.ts = 0
    setNearAu(null)
    figRef.current?.classList.remove('is-lens')
    kick()
  }

  return (
    <figure ref={figRef} className={`plate2 ${compact ? 'is-compact' : ''} ${className}`}>
      <svg ref={svgRef} viewBox={view} preserveAspectRatio={compact ? 'xMidYMid slice' : undefined} role="img"
        aria-label={t(['A portrait with the muscles of the face labelled', 'وێنەیەکی دەموچاو کە ماسولکەکانی ناونراون'])}
        onPointerMove={onMove} onPointerLeave={onLeave}>
        <defs>
          <clipPath id={`crop-${id}`}><rect x={CROP.x} y={CROP.y} width={CROP.w} height={CROP.h} rx="10" /></clipPath>
          {/* black and white, toned warm like the site: brown-black shadows (the page's #0b0809), bone highlights */}
          <filter id={`tone-${id}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.043 0.15 0.45 0.78 0.94" />
              <feFuncG type="table" tableValues="0.031 0.115 0.39 0.71 0.9" />
              <feFuncB type="table" tableValues="0.035 0.1 0.33 0.63 0.84" />
            </feComponentTransfer>
          </filter>
          <radialGradient id={`lensg-${id}`}>
            <stop offset="62%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <mask id={`lens-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="1000">
            <circle ref={maskRef} cx="400" cy="450" r="0" fill={`url(#lensg-${id})`} />
          </mask>
          <radialGradient id={`vig-${id}`} cx="50%" cy="46%" r="70%">
            <stop offset="55%" stopColor="#0b0809" stopOpacity="0" />
            <stop offset="100%" stopColor="#0b0809" stopOpacity="0.88" />
          </radialGradient>
          <filter id={`glow-${id}`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g clipPath={`url(#crop-${id})`}>
          <g className="plate2-pic">
            <image className="plate2-photo" href={PORTRAIT} x="0" y="0" width="800" height="1000" filter={`url(#tone-${id})`} />
            <image className="plate2-true" href={PORTRAIT} x="0" y="0" width="800" height="1000" mask={`url(#lens-${id})`} />
          </g>
          <rect x={CROP.x} y={CROP.y} width={CROP.w} height={CROP.h} fill={`url(#vig-${id})`} />
          <g ref={ringRef} className="plate2-lens" transform="translate(400 450) scale(0.001)" aria-hidden="true">
            <circle r={LENS * 0.9} vectorEffect="non-scaling-stroke" />
            <path d={`M0 ${-LENS * 0.9 - 8}v14M0 ${LENS * 0.9 - 6}v14M${-LENS * 0.9 - 8} 0h14M${LENS * 0.9 - 6} 0h14`} vectorEffect="non-scaling-stroke" />
          </g>
        </g>
        <rect className="plate2-frame" x={CROP.x} y={CROP.y} width={CROP.w} height={CROP.h} rx="10" />

        {PINS.map((p) => {
          const on = litSet.has(p.au) || hover === p.au || near === p.au
          const u = UNITS.find((x) => x.au === p.au)
          const l = local.find((x) => x.au === p.au)
          const left = p.side < 0
          const edge = left ? CROP.x + 6 : CROP.x + CROP.w - 6
          const end = left ? CROP.x - 14 : CROP.x + CROP.w + 14
          const tx = left ? CROP.x - 20 : CROP.x + CROP.w + 20
          const cross = 7
          return (
            <g key={p.au} className={`plate2-pin ${on ? 'on' : ''}`} tabIndex={compact ? -1 : 0}
              onPointerEnter={() => setHover(p.au)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(p.au)} onBlur={() => setHover(null)} onClick={() => setHover(p.au)}>
              {!compact && <polyline className="plate2-line" points={`${p.at[0]},${p.at[1]} ${edge},${p.row - 6} ${end},${p.row - 6}`} />}
              {on && <circle className="plate2-halo" cx={p.at[0]} cy={p.at[1]} r="9" filter={`url(#glow-${id})`} />}
              <path className="plate2-cross" d={`M${p.at[0] - cross} ${p.at[1]}h${cross * 2}M${p.at[0]} ${p.at[1] - cross}v${cross * 2}`} />
              {!compact && (
                <>
                  <rect className="plate2-hit" x={left ? tx - SIDE + 26 : tx - 6} y={p.row - 30} width={SIDE - 20} height="50" />
                  <text className="plate2-name" x={tx} y={p.row} textAnchor={left ? 'end' : 'start'}>{SHORT[p.au] || u.muscle}</text>
                  <text className="plate2-au" x={tx} y={p.row + 18} textAnchor={left ? 'end' : 'start'}>{`AU${p.au} · ${t.lang === 'ckb' ? l.name : u.name.toLowerCase()}`}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
      {caption && !compact && (
        <figcaption className="plate2-caption" aria-live="polite">
          {info ? (
            <>
              <span className="plate2-cap-name" lang="la">{info.en.muscle}</span>
              <span className="plate2-cap-what">AU{info.en.au} · {info.local.name} · {info.local.plain}</span>
            </>
          ) : (
            <span className="plate2-cap-hint">{t(['Move over his face to unmask it, or point at a label.', 'بەسەر دەموچاویدا بجووڵێ بۆ ئەوەی ڕووپۆشەکەی لابدەیت، یان ئاماژە بۆ ناوێک بکە.'])}</span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
