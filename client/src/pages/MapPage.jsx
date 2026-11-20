// The Map: a body of light. Touch a part to see what it says and what it feels; choose a feeling
// to see where people feel it.
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import ParticleBody, { REGIONS } from '../components/ParticleBody'
import GhostFibers from '../effects/GhostFibers'
import { useData } from '../i18n/data'
import { useT } from '../i18n'
import { useMedia, useTitle } from '../lib/hooks'
import Headline from '../components/Headline'

export default function MapPage() {
  const t = useT()
  const { REGION_INFO, BODY_MAPS, STRENGTH } = useData()
  useTitle(['The Map', 'نەخشەکە'])
  const [hover, setHover] = useState(null)
  const [region, setRegion] = useState(null)
  const [part, setPart] = useState(null)
  const [feel, setFeel] = useState(null)
  const narrow = useMedia('(max-width: 1100px)')
  const map = BODY_MAPS.find((m) => m.id === feel)
  const shown = part || region
  const info = shown ? REGION_INFO[shown] : null

  const select = (r) => { setRegion(r); setPart(null) }
  const layout = useMemo(() => (W, H) => ({ ox: W / 2, oy: H * 0.5, scale: Math.min(H * 0.44, W * 0.9) }), [])

  return (
    <div className="map-page">
      <div className="map-fibers" aria-hidden="true">
        <GhostFibers glowColor="#f0c25a" lineColor="#efe6dc" secondaryColor="#5b7cf0" speed={0.25} brightness={0.55} glow={0.5} threads={48} particles={0.3} sparkle={0.3} vignette={0.6} grain={0.03} mouseInteraction={false} intro />
      </div>

      <section className="map-grid">
        <aside className="map-rail">
          <Headline className="display map-title" text={t(['The Map', 'نەخشەکە'])} />
          <p className="map-lede">{t(['Touch any part of the body. Or choose a feeling and watch where people feel it.', 'دەست لە هەر بەشێکی جەستە بدە. یان هەستێک هەڵبژێرە و سەیر بکە خەڵک لە کوێدا هەستی پێدەکەن.'])}</p>
          <div className="feelings" role="group" aria-label={t(['Show where a feeling is felt', 'پیشانی بدە هەستێک لە کوێ هەستی پێدەکرێت'])}>
            {BODY_MAPS.map((m) => (
              <button key={m.id} className={`feeling cursor-target ${feel === m.id ? 'on' : ''}`} aria-pressed={feel === m.id} onClick={() => setFeel(feel === m.id ? null : m.id)}>
                {m.name}
              </button>
            ))}
          </div>
          <div className="feel-key" aria-live="polite">
            {map ? (
              <>
                <p className="feel-note">{map.note}</p>
                <p className="feel-legend ui"><span className="lg-hot" /> {t(['more activity', 'چالاکیی زیاتر'])} <span className="lg-cold" /> {t(['less activity', 'چالاکیی کەمتر'])}</p>
                <p className="feel-source">{t(['After body maps drawn by over 700 people in Finland, Sweden and Taiwan (Nummenmaa and colleagues, 2014). Simplified.', 'لە نەخشەی جەستەوە کە زیاتر لە ٧٠٠ کەس لە فینلەند، سوید و تایوان کێشایان (نوممێنما و هاوکارانی، ٢٠١٤). سادەکراوەتەوە.'])}</p>
              </>
            ) : <p className="feel-note muted">{t(['No feeling chosen: the body at rest.', 'هیچ هەستێک هەڵنەبژێردراوە: جەستە لە پشوودایە.'])}</p>}
          </div>
        </aside>

        <div className="map-stage">
          <ParticleBody heat={map?.heat} hover={hover} selected={region} onHover={setHover} onSelect={select} layout={layout}
            label={t(['A human body drawn in points of light. Choose a part from the list below the figure if you cannot point.', 'جەستەیەکی مرۆڤ کە بە خاڵی ڕووناکی کێشراوە. ئەگەر ناتوانیت ئاماژە بکەیت، بەشێک لە لیستی ژێر وێنەکە هەڵبژێرە.'])} />
          <div className={`map-hover ui ${hover && hover !== region ? 'show' : ''}`} aria-hidden="true">
            {hover ? REGION_INFO[hover].name : ''}
          </div>
          <nav className="map-parts" aria-label={t(['Parts of the body', 'بەشەکانی جەستە'])}>
            {REGIONS.map((r) => (
              <button key={r} className={`map-part ui cursor-target ${region === r ? 'on' : ''}`} onClick={() => select(region === r ? null : r)} aria-pressed={region === r}
                onPointerEnter={() => setHover(r)} onPointerLeave={() => setHover(null)}>
                {REGION_INFO[r].short}
              </button>
            ))}
          </nav>
        </div>

        <aside className={`map-panel ${info ? 'open' : ''}`} aria-live="polite">
          {!info && (
            <div className="map-empty">
              <p className="display map-empty-title">{t(['Nothing touched yet.', 'هێشتا دەستت لە هیچ نەداوە.'])}</p>
              <p className="muted">{t(['Every part of the body has things it signals to other people and things it feels on the inside. They are rarely the same.', 'هەر بەشێکی جەستە شتگەلێکی هەیە کە بە خەڵکی تری ڕادەگەیەنێت، و شتگەلێک کە لە ناوەوە هەستیان پێدەکات. کەم جار وەک یەکن.'])}</p>
            </div>
          )}
          {info && (
            <div className="region" key={shown}>
              {REGION_INFO[region]?.parts && (
                <div className="region-parts" role="tablist" aria-label={t(['Parts of the face', 'بەشەکانی دەموچاو'])}>
                  <button role="tab" aria-selected={!part} className={`chip ${!part ? 'on' : ''}`} onClick={() => setPart(null)}>{t(['Whole head', 'هەموو سەر'])}</button>
                  {REGION_INFO[region].parts.map((p) => (
                    <button key={p} role="tab" aria-selected={part === p} className={`chip ${part === p ? 'on' : ''}`} onClick={() => setPart(p)}>{REGION_INFO[p].name}</button>
                  ))}
                </div>
              )}
              <h2 className="display region-name">{info.name}</h2>
              <p className="region-line">{info.line}</p>
              <h3 className="region-h ui">{t(['What it says', 'چی دەڵێت'])}</h3>
              <ul className="signals" role="list">
                {info.says.map((s) => (
                  <li key={s.tell} className={`signal signal-${s.strength}`}>
                    <div className="signal-top">
                      <span className="signal-tell">{s.tell}</span>
                      <span className={`strength strength-${s.strength}`} title={STRENGTH[s.strength]}><i />{STRENGTH[s.strength]}</span>
                    </div>
                    <p className="signal-means">{s.means}</p>
                    <p className="signal-context"><span className="ui">{t(['But', 'بەڵام'])}</span>{s.context}</p>
                  </li>
                ))}
              </ul>
              <h3 className="region-h ui">{t(['What it feels', 'هەست بە چی دەکات'])}</h3>
              <p className="region-feels">{info.feels}</p>
              {(shown === 'arms' || shown === 'hands' || shown === 'eyes' || shown === 'brows') && (
                <Link to="/train" className="link-line region-link">{t(['Test your reading of this', 'خوێندنەوەت بۆ ئەمە تاقی بکەرەوە'])}</Link>
              )}
            </div>
          )}
        </aside>
      </section>
      {narrow && <p className="map-narrow-note wrap muted">{t(['On a phone, tap a part name under the figure.', 'لە مۆبایلدا، دەست لە ناوی بەشێک بدە لە ژێر وێنەکەدا.'])}</p>}
    </div>
  )
}
