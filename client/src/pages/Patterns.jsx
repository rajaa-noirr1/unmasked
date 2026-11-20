// Patterns: eight ways a body carries itself, laid out as plates in an atlas. Then the dark words.
import { useEffect, useRef, useState } from 'react'
import TiltedCard from '../effects/TiltedCard'
import DarkVeil from '../effects/DarkVeil'
import FuzzyText from '../effects/FuzzyText'
import Silhouette from '../components/Silhouette'
import { PATTERNS, DARK_WORDS, KINDS } from '../data/patterns'
import { useMedia, useReveal, useTitle } from '../lib/hooks'

const INK = { artery: '#e2434f', vein: '#7fa2ff', nerve: '#f0c25a' }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']

export default function Patterns() {
  useTitle('Patterns')
  const ref = useReveal()
  const [open, setOpen] = useState(null) // index of the open dossier
  return (
    <div ref={ref} className="patterns page">
      <div className="wrap">
        <header className="page-head patterns-head">
          <h1 className="display page-title">Patterns.</h1>
          <p className="lede">Sixteen ways people carry themselves. They are states, not types: everyone falls into each of them in some rooms, with some people. None of them is a diagnosis.</p>
          <p className="patterns-hint ui">Open a plate for its full dossier.</p>
        </header>
        <ol className="plates" role="list">
          {PATTERNS.map((p, i) => (
            <li key={p.id}>
              <Plate pattern={p} n={i} onOpen={() => setOpen(i)} />
            </li>
          ))}
        </ol>
      </div>
      <DarkWords />
      {open != null && <Dossier i={open} setI={setOpen} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Plate({ pattern: p, n, onOpen }) {
  const ink = INK[p.ink]
  return (
    <div className="plate-card" style={{ '--ink': ink }}>
      <TiltedCard
        containerWidth="100%" containerHeight="100%" imageWidth="100%" imageHeight="100%"
        rotateAmplitude={9} scaleOnHover={1.03} glare={0.4} glareColor={ink} shadow={0.75} radius={14}
        introDelay={(n % 4) * 110} gyroscope={false} showTooltip={false}
        captionText={`${p.name}. Open the dossier.`} onClick={onOpen} className="cursor-target"
      >
        <div className="plate-inner">
          <Silhouette pose={p.pose} light={ink} animate={false} label={`${p.name}: ${p.body[0].toLowerCase()}`} />
          <div className="plate-meta">
            <span className="plate-no ui">Plate {ROMAN[n]}</span>
            <h2 className="display plate-name">{p.name}</h2>
            <p className="plate-line">{p.line}</p>
          </div>
        </div>
      </TiltedCard>
    </div>
  )
}

function Dossier({ i, setI, onClose }) {
  const p = PATTERNS[i]
  const ink = INK[p.ink]
  const prev = (i + PATTERNS.length - 1) % PATTERNS.length
  const next = (i + 1) % PATTERNS.length
  const closeRef = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    const back = document.activeElement
    closeRef.current?.focus()
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      back?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setI(next)
      else if (e.key === 'ArrowLeft') setI(prev)
      else if (e.key === 'Tab') {
        // keep focus inside the dossier
        const items = sheetRef.current?.querySelectorAll('button, a[href]')
        if (!items?.length) return
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, setI, next, prev])

  useEffect(() => { sheetRef.current?.querySelector('.dossier-text')?.scrollTo(0, 0) }, [i])

  return (
    <div className="dossier" role="dialog" aria-modal="true" aria-labelledby="dossier-title" style={{ '--ink': ink }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dossier-sheet" ref={sheetRef}>
        <div className="dossier-figure" key={`f${p.id}`}>
          <Silhouette pose={p.pose} light={ink} label={`${p.name}: ${p.body.join(', ').toLowerCase()}`} />
          <span className="dossier-no ui">Plate {ROMAN[i]} of {ROMAN[PATTERNS.length - 1]}</span>
        </div>
        <div className="dossier-text">
          <div className="dossier-top">
            <h2 id="dossier-title" className="display dossier-name" key={p.id}>{p.name}</h2>
            <button ref={closeRef} className="dossier-close cursor-target" onClick={onClose} aria-label="Close the dossier">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          </div>
          <p className="dossier-line">{p.line}</p>
          <div className="dossier-grid" key={`g${p.id}`}>
            <Field label="What it means">{p.means}</Field>
            <Field label="How it behaves">{p.behaves}</Field>
            <Field label="In the body" list={p.body} />
            <Field label="With other people">{p.interacts}</Field>
            <Field label="Strengths" list={p.strengths} />
            <Field label="Costs" list={p.weaknesses} />
          </div>
          <p className="dossier-closer">{p.closer}</p>
          <div className="dossier-nav">
            <button className="cursor-target" onClick={() => setI(prev)}><span className="ui">Previous</span>{PATTERNS[prev].name}</button>
            <button className="cursor-target" onClick={() => setI(next)}><span className="ui">Next</span>{PATTERNS[next].name}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, list, children }) {
  return (
    <div className="dossier-field">
      <span className="qtag">{label}</span>
      {list ? <ul role="list">{list.map((x) => <li key={x}>{x}</li>)}</ul> : <p>{children}</p>}
    </div>
  )
}


function DarkWords() {
  const [i, setI] = useState(0)
  const n = DARK_WORDS.length
  const w = DARK_WORDS[i]
  const narrow = useMedia('(max-width: 1000px)')
  const small = useMedia('(max-width: 700px)')
  const long = w.word.length > 11
  const size = small ? (long ? '1.9rem' : '2.8rem') : long ? 'clamp(2.4rem, 3.6vw, 3.8rem)' : 'clamp(3rem, 5.4vw, 5.6rem)'
  const indexRef = useRef(null)
  const groups = Object.entries(KINDS).map(([kind, label]) => ({ kind, label, words: DARK_WORDS.map((d, k) => [d, k]).filter(([d]) => d.kind === kind) }))
  const pad = (k) => String(k + 1).padStart(2, '0')

  // on narrow screens the index is a strip that scrolls sideways: keep the chosen word in it, without moving the page
  useEffect(() => {
    if (!narrow) return
    const strip = indexRef.current
    const el = strip?.querySelector('.dw-word.on')
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [i, narrow])

  return (
    <section id="dark-words" className="dark-words">
      <div className="dark-veil" aria-hidden="true">
        <DarkVeil color="#9b1b2a" speed={0.3} warp={0.5} flow={0.8} glow={0.55} brightness={0.85} grain={0.04} mouseStrength={0.5} />
      </div>
      <div className="wrap">
        <header className="section-head rv">
          <span className="dw-kicker ui">{n} dark words</span>
          <h2 className="display section-title">Words people throw at each other.</h2>
          <p className="lede">Usually about an ex. Here is what each one really means, and whether a body can show it. Mostly, it cannot.</p>
        </header>
        <div className="dw-grid">
          <nav className="dw-index rv" aria-label="Choose a word" ref={indexRef}>
            {groups.map((g) => (
              <div key={g.kind} className="dw-group">
                <h3 className="dw-group-name ui">{g.label}</h3>
                <ul role="list">
                  {g.words.map(([d, k]) => (
                    <li key={d.id}>
                      <button aria-pressed={k === i} className={`dw-word cursor-target ${k === i ? 'on' : ''}`} onClick={() => setI(k)}>
                        <span className="dw-n ui">{pad(k)}</span>{d.word}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="dw-stage">
            <article className="dw-panel" key={w.id} aria-live="polite">
              <div className="dw-panel-top ui"><span>{KINDS[w.kind]}</span><span>{pad(i)} / {n}</span></div>
              <div className="dw-fuzzy" aria-hidden="true">
                <FuzzyText fontSize={size} fontWeight={300} fontFamily="Newsreader Variable, Georgia, serif" color="#efe6dc" baseIntensity={0.12} hoverIntensity={0.45} glitchMode glitchInterval={3400} glitchDuration={160}>
                  {w.word}
                </FuzzyText>
              </div>
              <h3 className="sr-only">{w.word}</h3>
              <div className="dw-fields">
                <div className="dw-field"><span className="qtag">What people mean</span><p>{w.people}</p></div>
                <div className="dw-field"><span className="qtag">Can a body show it?</span><p>{w.body}</p></div>
                <div className="dw-field dw-wide"><span className="qtag">What it actually is</span><p>{w.actually}</p></div>
                <div className="dw-field dw-wide dw-useful"><span className="qtag">What is actually useful</span><p>{w.useful}</p></div>
              </div>
              <div className="dw-step">
                <button className="cursor-target" onClick={() => setI((i - 1 + n) % n)}><span className="ui">Previous</span>{DARK_WORDS[(i - 1 + n) % n].word}</button>
                <button className="cursor-target" onClick={() => setI((i + 1) % n)}><span className="ui">Next</span>{DARK_WORDS[(i + 1) % n].word}</button>
              </div>
            </article>
          </div>
        </div>
        <p className="dw-note rv">If someone in your life makes you feel unsafe, that matters more than finding the right word for them. Tell someone you trust, or find a free helpline at <a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a>.</p>
      </div>
    </section>
  )
}
