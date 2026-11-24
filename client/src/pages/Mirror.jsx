// The Mirror: everyone around you can see your face, you never can. It shows you what your face gives
// away, muscle by muscle, so you can see yourself the way other people read you. Never your feelings.
// Three uses: Rehearse (talk for 10 seconds to 2 minutes, get a report of your tells and how you might come across), Poker face (keep them in),
// Perform (make an expression on demand and learn the muscles behind it).
import { useEffect, useMemo, useRef, useState } from 'react'
import Scanner from '../effects/Scanner'
import PhotoPlate from '../components/PhotoPlate'
import Headline from '../components/Headline'
import { UNITS, toUnits, matchScore } from '../data/mirror'
import { SECONDS, LENGTHS, BLINKS_TALKING, EXAMPLE } from '../data/rehearse'
import { summarize } from '../lib/rehearse'
import { readings, READINGS, CUES } from '../lib/readings'
import { useData, useRehearseContent } from '../i18n/data'
import { api } from '../lib/api'
import { useT } from '../i18n'
import { createTracker, drawMesh } from '../lib/faceTracker'
import { useStored, useTitle } from '../lib/hooks'

const ON = 0.32
const LABELLED = UNITS.filter((u) => u.au !== 43) // blinking moves all the time; it is counted, never labelled
const zoneLevel = (units, z) => Math.max(0, ...LABELLED.filter((u) => u.zone === z).map((u) => units[u.au] || 0))
const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const PROBLEMS = {
  denied: ['Camera permission was refused, so the Mirror is showing its example instead.', 'ڕێگەی کامێرا نەدرا، بۆیە ئاوێنەکە نموونەکەی پیشان دەدات.'],
  missing: ['No camera was found on this device, so the Mirror is showing its example instead.', 'هیچ کامێرایەک لەم ئامێرەدا نەدۆزرایەوە، بۆیە ئاوێنەکە نموونەکەی پیشان دەدات.'],
  busy: ['Another app is using the camera. Close it and try again.', 'بەرنامەیەکی تر کامێراکە بەکاردەهێنێت. دایبخە و دووبارە هەوڵ بدەرەوە.'],
  blocked: ['This browser does not allow camera access here, so the Mirror is showing its example instead.', 'ئەم وێبگەڕە لێرەدا ڕێگە بە کامێرا نادات، بۆیە ئاوێنەکە نموونەکەی پیشان دەدات.'],
  failed: ['Face tracking could not start (the first time it needs an internet connection), so the Mirror is showing its example instead.', 'شوێنکەوتنی دەموچاو دەستی پێنەکرد (بۆ یەکەمجار پێویستی بە ئینتەرنێتە)، بۆیە ئاوێنەکە نموونەکەی پیشان دەدات.'],
}
function cameraProblem(err) {
  if (err?.name === 'NotAllowedError') return 'denied'
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'missing'
  if (err?.name === 'NotReadableError') return 'busy'
  if (err?.name === 'NotSupportedError') return 'blocked'
  return 'failed'
}

const TABS = [
  ['rehearse', ['Rehearse', 'ڕاهێنان']],
  ['poker', ['Poker face', 'دەموچاوی بێهەست']],
  ['perform', ['Perform it', 'دروستی بکە']],
  ['free', ['Every muscle', 'هەموو ماسولکەکان']],
]

export default function Mirror() {
  const t = useT()
  const D = useData()
  const U = useMemo(() => Object.fromEntries(D.UNITS.map((u) => [u.au, u])), [D])
  useTitle(['The Mirror', 'ئاوێنەکە'])
  const [mode, setMode] = useState('intro') // intro · loading · live · demo
  const [problem, setProblem] = useState(null)
  const [units, setUnits] = useState({})
  const [found, setFound] = useState(true)
  const [tab, setTab] = useState('rehearse')
  const [perfI, setPerfI] = useState(0)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const live = useRef({ blinks: 0, blinkOn: false, roll: 0 }) // read by Rehearse without re-rendering
  const camOn = mode === 'loading' || mode === 'live'
  const langRef = useRef(t.lang) // the drawing loop reads the current language without restarting
  langRef.current = t.lang

  // camera → face tracker → muscle levels, every frame
  useEffect(() => {
    if (!camOn) return
    let stream, tracker, raf, alive = true, lastT = -1, frame = 0
    const smooth = {}
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('no camera access'), { name: 'NotSupportedError' })
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false })
        if (!alive) { s.getTracks().forEach((x) => x.stop()); return }
        stream = s
        const v = videoRef.current
        v.srcObject = s
        await v.play()
        const tr = await createTracker()
        if (!alive) { tr.close(); return }
        tracker = tr
        setMode('live')
        const c = canvasRef.current
        const ctx = c.getContext('2d')
        const tick = () => {
          raf = requestAnimationFrame(tick)
          if (v.readyState < 2 || v.currentTime === lastT) return
          lastT = v.currentTime
          if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight }
          const res = tracker.detect(v, performance.now())
          const face = res.faceLandmarks?.[0]
          const raw = toUnits(res.faceBlendshapes?.[0]?.categories)
          for (const u of UNITS) smooth[u.au] = (smooth[u.au] || 0) + ((face ? raw[u.au] : 0) - (smooth[u.au] || 0)) * 0.45
          // blinks are counted from the raw signal (they are too quick for the smoothed one), and the head's tilt
          const L = live.current
          if (face) {
            if (!L.blinkOn && raw[43] > 0.55) { L.blinkOn = true; L.blinks++ }
            else if (L.blinkOn && raw[43] < 0.3) L.blinkOn = false
            const a = face[33], b = face[263]
            L.roll = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
          }
          const labels = LABELLED.filter((u) => smooth[u.au] > ON).sort((a, b) => smooth[b.au] - smooth[a.au]).slice(0, 4)
            .map((u) => ({ name: u.muscle, au: u.au, lm: u.lm, level: smooth[u.au] }))
          const zones = { brows: zoneLevel(smooth, 'brows'), eyes: zoneLevel(smooth, 'eyes'), mouth: zoneLevel(smooth, 'mouth') }
          const k = Math.max(c.clientWidth / c.width, c.clientHeight / c.height) || 1 // object-fit: cover
          const visible = c.clientWidth / k
          drawMesh(ctx, face, tracker.lines, zones, labels, c.width, c.height, { s: 1 / k, x0: (c.width - visible) / 2, x1: (c.width + visible) / 2, lang: langRef.current })
          if (frame++ % 2 === 0) { setUnits({ ...smooth }); setFound(!!face) }
        }
        tick()
      } catch (err) {
        if (!alive) return
        console.warn('Mirror:', err)
        setProblem(cameraProblem(err))
        setMode('demo')
      }
    })()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((x) => x.stop())
      tracker?.close()
    }
  }, [camOn])

  const startCamera = () => { setProblem(null); setFound(true); setMode('loading') }
  if (mode === 'intro') return <Intro onStart={startCamera} onDemo={() => setMode('demo')} />

  const demo = mode === 'demo'
  const moving = LABELLED.filter((u) => (units[u.au] || 0) > ON).sort((a, b) => units[b.au] - units[a.au]).slice(0, 3)
  const lit = demo && tab === 'perform' ? Object.keys(D.TARGETS[perfI].need).map(Number) : []
  return (
    <div className="mirror page">
      <div className="wrap">
        <header className="mirror-head">
          <Headline className="display mirror-title" text={t(['The Mirror.', 'ئاوێنەکە.'])} />
          {demo
            ? <button className="btn btn-ghost cursor-target" onClick={startCamera}><span className="dot" />{t(['Use my camera', 'کامێراکەم بەکاربهێنە'])}</button>
            : <button className="btn btn-ghost cursor-target" onClick={() => setMode('intro')}>{t(['Turn the camera off', 'کامێراکە بکوژێنەوە'])}</button>}
        </header>

        <div className="mirror-grid">
          <div className="mirror-stage">
            {demo ? (
              <div className="mirror-portrait"><PhotoPlate lit={lit} /></div>
            ) : (
              <div className={`mirror-frame is-${mode}`}>
                <video ref={videoRef} className="mirror-video" playsInline muted />
                <canvas ref={canvasRef} className="mirror-mesh" aria-hidden="true" />
                {mode === 'loading' && <div className="mirror-msg ui"><span className="pulse" />{t(['Waking the camera and the face tracker…', 'کامێرا و شوێنکەوتنی دەموچاو هەڵدەکرێن…'])}</div>}
                {mode === 'live' && !found && <div className="mirror-msg ui">{t(['No face in view. Come closer, into the light.', 'هیچ دەموچاوێک دیار نییە. نزیکتر وەرە، بۆ ناو ڕووناکی.'])}</div>}
                <span className="mirror-corner tl" /><span className="mirror-corner tr" /><span className="mirror-corner bl" /><span className="mirror-corner br" />
              </div>
            )}
            {problem && <p className="mirror-problem ui">{t(PROBLEMS[problem])}</p>}
            {!demo && (
              <div className="mirror-now" aria-live="off">
                <span className="ui mirror-now-label">{t(['Moving now', 'ئێستا دەجووڵێت'])}</span>
                {moving.length ? (
                  <ul className="mirror-now-list" role="list">
                    {moving.map((u) => (
                      <li key={u.au}>
                        <span className="display" lang="la">{u.muscle}</span>
                        <span className="ui">AU{u.au} · {U[u.au].plain}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="display mirror-now-still">{t(['Still. Nothing is moving.', 'بێجووڵە. هیچ شتێک ناجووڵێت.'])}</p>}
              </div>
            )}
          </div>

          <aside className="mirror-side">
            <div className="mirror-tabs" role="tablist" aria-label={t(['What to do with the mirror', 'چی بکەیت بە ئاوێنەکە'])}>
              {TABS.map(([id, name]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={`chip cursor-target ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{t(name)}</button>
              ))}
            </div>
            {tab === 'rehearse' && <Rehearse units={units} found={found} live={live} demo={demo} />}
            {tab === 'poker' && <Poker units={units} demo={demo} prompts={D.PROMPTS} />}
            {tab === 'perform' && <Perform units={units} demo={demo} i={perfI} setI={setPerfI} U={U} targets={D.TARGETS} />}
            {tab === 'free' && <Muscles units={units} U={U} demo={demo} />}
            <p className="mirror-honest">
              {t(['The Mirror names muscles and the cues other people tend to read. The readings in Rehearse (lying, hiding something, nervous, excited, calm) are guesses at how you might come across, made from those cues: they are not your feelings, and software that claims to read emotions or lies from faces is scientifically contested. The muscle names come from the Facial Action Coding System; the tracking only approximates it.', 'ئاوێنەکە ناوی ماسولکەکان و ئەو ئاماژانە دەڵێت کە خەڵکی تر زۆرجار دەیانخوێننەوە. خوێندنەوەکانی ڕاهێنان (درۆکردن، شاردنەوەی شتێک، دڵەڕاوکێ، بەجۆش، ئارام) مەزەندەن لەوەی چۆن لەوانەیە دەربکەویت، لەو ئاماژانەوە دروستکراون: هەستەکانت نین، و ئەو بەرنامانەی بانگەشەی خوێندنەوەی هەست یان درۆ لە دەموچاوەوە دەکەن، لە ڕووی زانستییەوە جێی مشتومڕن. ناوی ماسولکەکان لە سیستەمی کۆدکردنی جووڵەی دەموچاوەوە (FACS) هاتوون؛ شوێنکەوتنەکە تەنها نزیکەی ئەوە دەکات.'])}
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Intro({ onStart, onDemo }) {
  const t = useT()
  const uses = [
    [['Rehearse', 'ڕاهێنان'], ['Before an interview, a presentation or a hard conversation: talk to the camera for 10 seconds to 2 minutes and get a report of what your face gave away, and how you might come across.', `پێش چاوپێکەوتنێک، پێشکەشکردنێک یان گفتوگۆیەکی سەخت: ${t.n(10)} چرکە تا ${t.n(2)} خولەک قسە بۆ کامێراکە بکە و ڕاپۆرتێک وەربگرە لەسەر ئەوەی دەموچاوت ئاشکرای کرد، و چۆن لەوانەیە دەربکەویت.`]],
    [['Poker face', 'دەموچاوی بێهەست'], ['Keep your face still while six lines try to provoke it, and learn which muscle gives you away.', 'دەموچاوت بێجووڵە ڕابگرە لە کاتێکدا شەش ڕستە هەوڵ دەدەن بیوروژێنن، و فێر بە کام ماسولکە ئاشکرات دەکات.']],
    [['Perform', 'دروستکردن'], ['Make an expression on demand and learn the muscles behind it, so you can spot them in other faces.', 'دەربڕینێک بە داواکاری دروست بکە و ماسولکەکانی پشتی فێر بە، بۆ ئەوەی لە دەموچاوی خەڵکی تردا بیانناسیتەوە.']],
  ]
  return (
    <div className="mirror-intro">
      <div className="mirror-scanner" aria-hidden="true">
        <Scanner color1="#5b7cf0" color2="#f0c25a" color3="#fff3d6" speed={0.3} sweepSpeed={0.16} sweepWidth={1.9} bandDensity={13} brightness={0.75} glow={0.5} vignette={0.75} scanlineIntensity={0.35} grainIntensity={0.03} mouseStrength={0.5} />
      </div>
      <div className="wrap mirror-intro-grid">
        <header className="mirror-intro-head">
          <span className="mirror-kicker ui">{t(['See what you give away', 'ببینە چی ئاشکرا دەکەیت'])}</span>
          <Headline className="display page-title" text={t(['The Mirror.', 'ئاوێنەکە.'])} />
        </header>
        <div className="mirror-intro-copy">
          <p className="lede">{t(['Everyone around you can see your face. You never can. The Mirror shows you what it gives away, so you can see yourself the way other people read you.', 'هەموو ئەوانەی دەوروبەرت دەموچاوت دەبینن. تۆ هەرگیز نایبینیت. ئاوێنەکە پیشانت دەدات چی ئاشکرا دەکات، بۆ ئەوەی خۆت ببینیت وەک ئەوەی خەڵکی تر دەتخوێننەوە.'])}</p>
          <ol className="mirror-uses" role="list">
            {uses.map(([name, text], k) => (
              <li key={name[0]}><span className="mirror-use-n ui">{t.n(k + 1)}</span><div><b className="display">{t(name)}</b><span>{t(text)}</span></div></li>
            ))}
          </ol>
          <div className="consent">
            <p><b>{t(['Your camera stays on this device.', 'کامێراکەت لەسەر ئەم ئامێرە دەمێنێتەوە.'])}</b> {t(['Nothing is recorded, saved or sent anywhere: no video, no sound. The face tracker (around 12 MB) downloads once and runs inside your browser.', 'هیچ شتێک تۆمار، پاشەکەوت یان بۆ هیچ شوێنێک نانێردرێت: نە ڤیدیۆ، نە دەنگ. شوێنکەوتنی دەموچاو (نزیکەی ١٢ مێگابایت) یەکجار دادەبەزێت و لە ناو وێبگەڕەکەتدا کار دەکات.'])}</p>
          </div>
          <div className="mirror-actions">
            <button className="btn btn-light cursor-target" onClick={onStart}><span className="dot" />{t(['Turn on the mirror', 'ئاوێنەکە هەڵبکە'])}</button>
            <button className="btn btn-ghost cursor-target" onClick={onDemo}>{t(['See an example first', 'سەرەتا نموونەیەک ببینە'])}</button>
          </div>
        </div>
        <div className="mirror-intro-plate">
          <PhotoPlate />
        </div>
      </div>
    </div>
  )
}

// ── Rehearse ─────────────────────────────────────────────────────────────────────────────────────

function Rehearse({ units, found, live, demo }) {
  const t = useT()
  const { SCENARIOS } = useRehearseContent()
  const [saved, setSaved] = useState(null) // the row the database kept, with the previous try next to it
  const [phase, setPhase] = useState('pick') // pick · countdown · recording · report
  const [sc, setSc] = useState(SCENARIOS[0].id)
  const [count, setCount] = useState(3)
  const [left, setLeft] = useState(SECONDS)
  const [result, setResult] = useState(null)
  const [liveRead, setLiveRead] = useState(null) // the readings so far, while recording
  const [stored, setLength] = useStored('rehearseSeconds', SECONDS)
  const length = LENGTHS.includes(stored) ? stored : SECONDS
  const [history, setHistory] = useStored('rehearsals', [])
  const latest = useRef(units)
  latest.current = units
  const seen = useRef(found)
  seen.current = found
  const samples = useRef([])
  const stopRef = useRef(null) // ends the recording early
  const scenario = SCENARIOS.find((s) => s.id === sc)

  useEffect(() => {
    if (phase !== 'countdown') return
    setCount(3)
    const id = setInterval(() => setCount((c) => {
      if (c <= 1) { clearInterval(id); setPhase('recording'); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'recording') return
    samples.current = []
    const blinks0 = live.current.blinks
    const t0 = performance.now()
    setLeft(length)
    setLiveRead(null)
    const sample = setInterval(() => {
      samples.current.push({ u: { ...latest.current }, roll: live.current.roll, face: seen.current, blinks: live.current.blinks - blinks0 })
      const elapsed = (performance.now() - t0) / 1000
      setLeft(Math.max(0, Math.ceil(length - elapsed)))
      // the readings so far, twice a second, counted over at least five seconds so the first moments do not swing them
      if (samples.current.length % 5 === 0 && elapsed > 1.5) {
        const span = Math.max(elapsed, 5)
        setLiveRead({ ...summarize(samples.current, span), seconds: span })
      }
      if (elapsed >= length) finish(elapsed)
    }, 100)
    const finish = (elapsed) => {
      clearInterval(sample)
      const r = { ...summarize(samples.current, elapsed), seconds: elapsed }
      setResult(r)
      setSaved(null)
      setHistory((h) => [{ sc, at: Date.now(), ...r, timeline: undefined }, ...h].slice(0, 20))
      setPhase('report')
      api.saveRehearsal({
        scenario: sc, lang: t.lang, seconds: Math.min(120, Math.max(0.1, Math.round(elapsed * 10) / 10)),
        faceShare: r.faceShare, blinksPerMin: r.blinksPerMin, smiles: r.smiles, smilesEyes: r.smilesEyes, presses: r.presses,
        browUp: r.browUp, browDown: r.browDown, still: r.still, tilt: r.tilt,
      }).then((row) => row && setSaved(row))
    }
    stopRef.current = () => finish((performance.now() - t0) / 1000)
    return () => clearInterval(sample)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  if (demo) {
    return (
      <div className="rehearse">
        <p className="perform-hint">{t(['Pick a situation and how long to talk (10 seconds to 2 minutes), talk to the camera as if the person were in front of you, and see what your face gave away, and how you might come across. Rehearsing needs your camera; this is an example of the report you would get.', `دۆخێک هەڵبژێرە و چەند قسە بکەیت (${t.n(10)} چرکە تا ${t.n(2)} خولەک)، قسە بۆ کامێراکە بکە وەک ئەوەی کەسەکە لەبەردەمتدا بێت، و ببینە دەموچاوت چی ئاشکرا کرد و چۆن لەوانەیە دەربکەویت. ڕاهێنان پێویستی بە کامێراکەتە؛ ئەمە نموونەیەکی ئەو ڕاپۆرتەیە کە وەریدەگریت.`])}</p>
        <Report result={EXAMPLE} example />
      </div>
    )
  }

  if (phase === 'pick') {
    return (
      <div className="rehearse">
        <h2 className="display perform-name">{t(['Rehearse.', 'ڕاهێنان.'])}</h2>
        <p className="perform-hint">{t(['Pick a situation and how long to talk. Then talk to the camera as if the person were in front of you. Afterwards you will see what someone across the table could have read in your face, and how you might have come across.', 'دۆخێک هەڵبژێرە و چەند قسە بکەیت. پاشان قسە بۆ کامێراکە بکە وەک ئەوەی کەسەکە لەبەردەمتدا بێت. دواتر دەبینیت کەسێک لە بەرامبەرتەوە دەیتوانی چی لە دەموچاوتدا بخوێنێتەوە، و چۆن لەوانەیە دەرکەوتبیت.'])}</p>
        <div className="rehearse-scenes" role="radiogroup" aria-label={t(['Situations', 'دۆخەکان'])}>
          {SCENARIOS.map((s) => (
            <button key={s.id} role="radio" aria-checked={sc === s.id} className={`chip cursor-target ${sc === s.id ? 'on' : ''}`} onClick={() => setSc(s.id)}>{t(s.name)}</button>
          ))}
        </div>
        <p className="display rehearse-prompt">“{t(scenario.prompt)}”</p>
        <div className="rehearse-length">
          <span className="ui">{t(['How long', 'چەند درێژ'])}</span>
          <div className="rehearse-scenes" role="radiogroup" aria-label={t(['How long to talk', 'چەند قسە بکەیت'])}>
            {LENGTHS.map((n) => (
              <button key={n} role="radio" aria-checked={length === n} className={`chip cursor-target ${length === n ? 'on' : ''}`} onClick={() => setLength(n)}>{lengthName(n, t, true)}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-light cursor-target" onClick={() => setPhase('countdown')} disabled={!found}><span className="dot" />{t(['Start', 'دەست پێبکە'])} ({lengthName(length, t)})</button>
        {!found && <p className="perform-state ui">{t(['Get your face into the frame first.', 'سەرەتا دەموچاوت بخەرە ناو چوارچێوەکەوە.'])}</p>}
        {history.length > 0 && <p className="perform-state ui">{t([`You have rehearsed ${history.length} times in this browser.`, `${t.n(history.length)} جار لەم وێبگەڕەدا ڕاهێنانت کردووە.`])}</p>}
      </div>
    )
  }

  if (phase === 'countdown' || phase === 'recording') {
    return (
      <div className="rehearse">
        <p className="perform-count ui">{t(scenario.name)}</p>
        <p className="display rehearse-prompt big">“{t(scenario.prompt)}”</p>
        {phase === 'countdown' ? (
          <p className="rehearse-count display">{t.n(count)}</p>
        ) : (
          <>
            <div className="rehearse-bar"><span style={{ transform: `scaleX(${left / length})` }} /></div>
            <p className="perform-state ui"><span className="rec-dot" /> {t(['Talk to the camera.', 'قسە بۆ کامێراکە بکە.'])} {clock(left, t)} {t(['left', 'ماوە'])}</p>
            <button className="btn btn-ghost cursor-target" onClick={() => stopRef.current?.()}>{t(['Stop early', 'زووتر ڕایبگرە'])}</button>
            {liveRead && liveRead.faceShare >= 50 && <Reading result={liveRead} seconds={liveRead.seconds} live />}
          </>
        )}
      </div>
    )
  }

  // the previous try at this situation: from the database when it answered, else from this browser
  const fromDb = saved && saved.attempt_number > 1 && {
    blinksPerMin: saved.prev_blinks_per_min, smiles: saved.prev_smiles, presses: saved.prev_presses,
    browUp: saved.prev_brow_up, still: saved.prev_still, tilt: saved.prev_tilt,
  }
  const before = saved ? fromDb || undefined : history.filter((h) => h.sc === sc)[1]
  return (
    <div className="rehearse">
      <Report result={result} previous={before} saved={saved} />
      <div className="qcard-next">
        <button className="btn btn-light cursor-target" onClick={() => setPhase('countdown')}>{t(['Try again', 'دووبارە هەوڵ بدەرەوە'])}</button>
        <button className="btn btn-ghost cursor-target" onClick={() => setPhase('pick')}>{t(['Another situation', 'دۆخێکی تر'])}</button>
      </div>
    </div>
  )
}

function Report({ result: r, previous, example = false, saved = null }) {
  const t = useT()
  const { STRENGTH } = useData()
  const { METRICS } = useRehearseContent()
  if (r.faceShare < 50) {
    return (
      <div className="report">
        <h2 className="display perform-name">{t(['Your face was hard to see.', 'دەموچاوت بە زەحمەت دەبینرا.'])}</h2>
        <p className="perform-hint">{t(['It was in view less than half the time. Sit facing the camera, with light in front of you, and try again.', 'کەمتر لە نیوەی کات دیار بوو. ڕووبەڕووی کامێراکە دابنیشە، ڕووناکی لە پێشتەوە بێت، و دووبارە هەوڵ بدەرەوە.'])}</p>
      </div>
    )
  }
  const was = (v, unit = '') => (previous && previous[v] != null ? <span className="report-was ui">{t(['last time', 'جاری پێشوو'])} {t.n(previous[v])}{unit}</span> : null)
  const cards = [
    ['blinks', `${t.n(r.blinksPerMin)}`, t(['a minute', 'لە خولەکێکدا']), was('blinksPerMin'), r.blinksPerMin > BLINKS_TALKING * 1.4 ? 'high' : r.blinksPerMin < BLINKS_TALKING * 0.5 ? 'low' : null],
    ['smiles', `${t.n(r.smiles)}`, t([`${r.smilesEyes} reached the eyes`, `${t.n(r.smilesEyes)} گەیشتنە چاوەکان`]), was('smiles'), null],
    ['presses', `${t.n(r.presses)}`, t(['times', 'جار']), was('presses'), null],
    ['brows', `${t.n(r.browUp)}%`, t([`raised · ${r.browDown}% lowered`, `بەرز · ${t.n(r.browDown)}% داگیراو`]), was('browUp', '%'), null],
    ['still', `${t.n(r.still)}%`, t(['of the time', 'ی کاتەکە']), was('still', '%'), null],
    ['tilt', `${t.n(r.tilt)}%`, t(['of the time', 'ی کاتەکە']), was('tilt', '%'), null],
  ]
  return (
    <div className="report">
      <span className="report-kicker ui">{example ? t(['Example report', 'نموونەی ڕاپۆرت']) : t(['Your report', 'ڕاپۆرتەکەت'])}</span>
      <h2 className="display perform-name">{t(['What your face gave away.', 'دەموچاوت چی ئاشکرا کرد.'])}</h2>
      <p className="perform-hint">{t(['What someone across the table could have read in those seconds. Cues, not verdicts: they say where people might look, not what you felt.', 'ئەوەی کەسێک لە بەرامبەرتەوە دەیتوانی لەو چرکانەدا بیخوێنێتەوە. ئاماژەن، نەک بڕیار: دەڵێن خەڵک لەوانەیە سەیری کوێ بکەن، نەک تۆ هەستت بە چی کرد.'])}</p>
      <Reading result={r} seconds={r.seconds || SECONDS} />
      <Timeline data={r.timeline} seconds={r.seconds || SECONDS} />
      <ul className="report-cards" role="list">
        {cards.map(([key, value, unit, last, flag]) => (
          <li key={key} className={`report-card ${flag ? `is-${flag}` : ''}`}>
            <div className="report-top">
              <span className="report-title ui">{t(METRICS[key].title)}</span>
              <span className={`strength strength-${METRICS[key].strength}`} title={STRENGTH[METRICS[key].strength]}><i />{STRENGTH[METRICS[key].strength]}</span>
            </div>
            <p className="report-value"><b className="display">{value}</b> <span className="ui">{unit}</span> {last}</p>
            <p className="report-read">{t(METRICS[key].read)}</p>
          </li>
        ))}
      </ul>
      {saved ? (
        <p className="perform-state ui">{t([`Nothing was recorded: no video and no sound. Only these numbers were saved, in the database, as try ${saved.attempt_number} at this situation.`, `هیچ شتێک تۆمار نەکرا: نە ڤیدیۆ و نە دەنگ. تەنها ئەم ژمارانە پاشەکەوت کران، لە داتابەیسەکەدا، وەک هەوڵی ${t.n(saved.attempt_number)} بۆ ئەم دۆخە.`])}</p>
      ) : (
        <p className="perform-state ui">{t(['Nothing was recorded: no video and no sound. Only these numbers are kept, in this browser, so you can compare your next try.', 'هیچ شتێک تۆمار نەکرا: نە ڤیدیۆ و نە دەنگ. تەنها ئەم ژمارانە دەمێننەوە، لەم وێبگەڕەدا، بۆ ئەوەی هەوڵی داهاتووت بەراورد بکەیت.'])}</p>
      )}
    </div>
  )
}

// How you might come across: five readings made from the report's cues (lib/readings.js), each with the
// cues that drove it. Live while recording (bars only), in full in the report.
function Reading({ result, seconds, live = false }) {
  const t = useT()
  const R = readings(result, seconds)
  const pct = (v) => (t.lang === 'ckb' ? `٪${t.n(v)}` : `${v}%`)
  return (
    <section className={`reading ${live ? 'is-live' : ''}`} aria-label={t(['How you might come across', 'چۆن لەوانەیە دەربکەویت'])}>
      <span className="report-kicker ui">{live ? t(['Reading you, live', 'ڕاستەوخۆ دەتخوێنێتەوە']) : t(['How you might come across', 'چۆن لەوانەیە دەربکەویت'])}</span>
      <ul className="reading-list" role="list">
        {READINGS.map((x) => {
          const v = R[x.id]
          return (
            <li key={x.id} className={`reading-row tone-${x.tone}`}>
              <span className="reading-name ui">{t(x.name)}</span>
              <span className="reading-bar" aria-hidden="true"><i style={{ transform: `scaleX(${v.percent / 100})` }} /></span>
              <b className="reading-pct ui">{pct(v.percent)}</b>
              {!live && v.why.length > 0 && <span className="reading-why ui">{t(['from ', 'لە '])}{v.why.map((c) => t(CUES[c])).join(t([', ', '، ']))}</span>}
            </li>
          )
        })}
      </ul>
      {!live && (
        <p className="reading-note ui">{t(['A guess at what people may read into these seconds, from the cues they tend to react to. It is not what you felt, and no software can tell a lie from a face: people themselves get it right only about 54% of the time.', 'مەزەندەیەکە لەوەی خەڵک لەوانەیە لەم چرکانەدا بیخوێننەوە، لەو ئاماژانەوە کە زۆرجار کاردانەوەیان بۆی هەیە. ئەوە نییە کە تۆ هەستت پێکرد، و هیچ بەرنامەیەک ناتوانێت درۆ لە دەموچاوەوە بناسێتەوە: خەڵک خۆیان تەنها نزیکەی ٪٥٤ی جار ڕاست دەردەچن.'])}</p>
      )}
    </section>
  )
}

// a length as people say it: 10 seconds, 1 minute (short: 10 s, 1 min)
function lengthName(n, t, short = false) {
  if (n < 60) return short ? t([`${n} s`, `${t.n(n)} چرکە`]) : t([`${n} seconds`, `${t.n(n)} چرکە`])
  const m = n / 60
  return short ? t([`${m} min`, `${t.n(m)} خولەک`]) : t([`${m} minute${m > 1 ? 's' : ''}`, `${t.n(m)} خولەک`])
}

// time left: 42 under a minute, 1:05 above
function clock(left, t) {
  if (left < 60) return t([`${left} seconds`, `${t.n(left)} چرکە`])
  const m = Math.floor(left / 60), s = left % 60
  return `${t.n(m)}:${s < 10 ? t.n(0) : ''}${t.n(s)}`
}

// marks along the timeline: every 5 s for 10 s, every 10 s for 30 s, every 15 s for a minute, every 30 s for two
function ticks(seconds) {
  const step = seconds <= 12 ? 5 : seconds <= 35 ? 10 : seconds <= 70 ? 15 : 30
  return Array.from({ length: Math.floor(seconds / step + 0.001) + 1 }, (_, k) => k * step)
}

// four lanes over the rehearsal's seconds: smiles, raised brows, pressed lips, blinks
function Timeline({ data, seconds }) {
  const t = useT()
  const W = 600, lane = 30, H = lane * 4 + 22
  const n = Math.max(1, data.length - 1)
  const x = (i) => 96 + (i / n) * (W - 104)
  const line = (k, row) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${(row * lane + lane - 4 - Math.min(1, d[k]) * (lane - 10)).toFixed(1)}`).join(' ')
  const lanes = [['Smiles', 'زەردەخەنە'], ['Brows raised', 'برۆی بەرز'], ['Lips pressed', 'لێوی پەستێنراو'], ['Blinks', 'چاوترووکاندن']]
  return (
    <svg className="timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(['A timeline of smiles, raised brows, pressed lips and blinks', 'هێڵی کاتی زەردەخەنە، برۆی بەرز، لێوی پەستێنراو و چاوترووکاندن'])}>
      {lanes.map((name, row) => (
        <g key={row}>
          <line x1="96" x2={W - 8} y1={row * lane + lane - 4} y2={row * lane + lane - 4} className="tl-base" />
          <text x="88" y={row * lane + lane - 8} className="tl-label" textAnchor="end">{t(name)}</text>
        </g>
      ))}
      <path d={line(0, 0)} className="tl-smile" />
      <path d={line(1, 1)} className="tl-brow" />
      {data.map((d, i) => (d[2] ? <rect key={`p${i}`} x={x(i) - 1.5} y={2 * lane + 8} width="3" height={lane - 12} className="tl-press" /> : null))}
      {data.map((d, i) => (d[3] ? <line key={`b${i}`} x1={x(i)} x2={x(i)} y1={3 * lane + 8} y2={3 * lane + lane - 4} className="tl-blink" /> : null))}
      {ticks(seconds).map((s) => (
        <text key={s} x={96 + (s / seconds) * (W - 104)} y={H - 4} className="tl-time" textAnchor="middle">{t.n(s)}{t(['s', 'چ'])}</text>
      ))}
    </svg>
  )
}

// ── Every muscle, Perform, Poker ────────────────────────────────────────────────────────────────

function Muscles({ units, U, demo }) {
  const t = useT()
  const zones = [['brows', ['Brows', 'برۆکان']], ['eyes', ['Eyes', 'چاوەکان']], ['nose', ['Nose', 'لووت']], ['mouth', ['Mouth and jaw', 'دەم و شەویلگە']]]
  return (
    <div className="muscles-wrap">
      {demo && <p className="perform-hint">{t(['With your camera on, each bar moves with that muscle. Point at the labels on the portrait to see where each one is.', 'کاتێک کامێراکەت هەڵدەکەیت، هەر هێڵێک لەگەڵ ئەو ماسولکەیە دەجووڵێت. ئاماژە بۆ ناوەکانی سەر وێنەکە بکە بۆ ئەوەی ببینیت هەر یەکێک لە کوێیە.'])}</p>}
      <div className="muscles">
        {zones.map(([z, name]) => (
          <div key={z} className="muscle-zone">
            <h3 className="region-h ui">{t(name)}</h3>
            {UNITS.filter((u) => u.zone === z).map((u) => {
              const v = Math.min(1, units[u.au] || 0)
              return (
                <div key={u.au} className={`muscle ${v > ON ? 'on' : ''}`}>
                  <span className="muscle-au ui">AU{u.au}</span>
                  <span className="muscle-name">{U[u.au].plain}</span>
                  <span className="muscle-latin" lang="la">{u.muscle}</span>
                  <span className="muscle-bar"><span style={{ transform: `scaleX(${v})` }} /></span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Perform({ units, demo, i, setI, U, targets }) {
  const t = useT()
  const target = targets[i]
  const score = matchScore(target, units)
  const scoreRef = useRef(score)
  scoreRef.current = score
  const [ticks, setTicks] = useState(0) // a tenth of a second each; ten in a row is a hold
  const [held, setHeld] = useState([])
  useEffect(() => {
    setTicks(0)
    if (demo) return
    const id = setInterval(() => setTicks((n) => (n >= 10 ? n : scoreRef.current > 0.78 ? n + 1 : Math.max(0, n - 2))), 100)
    return () => clearInterval(id)
  }, [i, demo])
  const success = !demo && ticks >= 10
  useEffect(() => { if (success) setHeld((h) => (h.includes(target.id) ? h : [...h, target.id])) }, [success, target.id])

  return (
    <div className="perform">
      <div className="perform-steps" aria-hidden="true">
        {targets.map((x, k) => <span key={x.id} className={`${k === i ? 'now' : ''} ${held.includes(x.id) ? 'held' : ''}`} />)}
      </div>
      <p className="perform-count ui">{t([`${i + 1} of ${targets.length}`, `${t.n(i + 1)} لە ${t.n(targets.length)}`])}{held.length ? ` · ${t([`${held.length} held`, `${t.n(held.length)} ڕاگیراو`])}` : ''}</p>
      <h2 className="display perform-name">{target.name}</h2>
      <p className="perform-hint">{target.hint}</p>
      <ul className="perform-needs" role="list">
        {Object.entries(target.need).map(([au, lvl]) => {
          const u = UNITS.find((x) => x.au === Number(au))
          const v = units[au] || 0
          return (
            <li key={au} className={v >= lvl ? 'met' : ''}>
              <span className="need-name"><span className="display" lang="la">{u.muscle}</span><span className="ui">{U[u.au].plain}</span></span>
              <span className="need-bar"><span style={{ transform: `scaleX(${Math.min(1, v / lvl)})` }} /></span>
            </li>
          )
        })}
        {target.avoid.map((au) => {
          const u = UNITS.find((x) => x.au === au)
          return <li key={`x${au}`} className={`avoid ${(units[au] || 0) > 0.2 ? 'bad' : ''}`}><span className="ui">{t(['Keep still:', 'بێجووڵەی بهێڵەوە:'])} <span lang="la">{u.muscle}</span></span></li>
        })}
      </ul>
      {!demo && <div className={`perform-meter ${success ? 'won' : ''}`}><span style={{ transform: `scaleX(${ticks / 10})` }} /></div>}
      <p className="perform-state ui">
        {demo ? t(['The muscles for this expression are lit on the portrait. Turn on your camera to try it with your own face.', 'ماسولکەکانی ئەم دەربڕینە لەسەر وێنەکە ڕووناک کراونەتەوە. کامێراکەت هەڵبکە بۆ ئەوەی بە دەموچاوی خۆت تاقی بکەیتەوە.'])
          : success ? t(['Held for a full second. That is the pattern.', 'چرکەیەکی تەواو ڕاتگرت. ئەمە شێوازەکەیە.'])
          : score > 0.78 ? t(['Hold it…', 'ڕایبگرە…'])
          : t([`${Math.round(score * 100)}% of the pattern`, `٪${t.n(Math.round(score * 100))} ی شێوازەکە`])}
      </p>
      <button className="btn btn-ghost cursor-target" onClick={() => setI((x) => (x + 1) % targets.length)}>{success || demo ? t(['Next expression', 'دەربڕینی داهاتوو']) : t(['Skip this one', 'ئەمەیان بپەڕێنە'])}</button>
    </div>
  )
}

function Poker({ units, demo, prompts }) {
  const t = useT()
  const [phase, setPhase] = useState('idle') // idle · baseline · prompts · result
  const [round, setRound] = useState(0)
  const [p, setP] = useState(0)
  const [leaks, setLeaks] = useState([])
  // the order holds positions, so the lines follow a change of language
  const order = useMemo(() => shuffle(prompts.map((_, k) => k)).slice(0, 6), [round, prompts.length])
  const base = useRef({})
  const latest = useRef(units)
  latest.current = units
  const lastLeak = useRef(0)

  // three seconds of the face at rest, averaged: that is the baseline every leak is measured from
  useEffect(() => {
    if (phase !== 'baseline') return
    const sum = {}
    let n = 0
    const id = setInterval(() => { n++; for (const u of UNITS) sum[u.au] = (sum[u.au] || 0) + (latest.current[u.au] || 0) }, 100)
    const done = setTimeout(() => {
      base.current = Object.fromEntries(UNITS.map((u) => [u.au, n ? sum[u.au] / n : 0]))
      setLeaks([]); setP(0); setPhase('prompts')
    }, 3000)
    return () => { clearInterval(id); clearTimeout(done) }
  }, [phase])

  useEffect(() => {
    if (phase !== 'prompts') return
    const id = setTimeout(() => (p + 1 < order.length ? setP(p + 1) : setPhase('result')), 4500)
    return () => clearTimeout(id)
  }, [phase, p, order.length])

  // a leak: any muscle moving well past where it rested
  useEffect(() => {
    if (phase !== 'prompts') return
    const now = performance.now()
    if (now - lastLeak.current < 900) return
    const moved = LABELLED.map((u) => [u, (units[u.au] || 0) - (base.current[u.au] || 0)]).filter(([, d]) => d > 0.28).sort((a, b) => b[1] - a[1])
    if (moved.length) { lastLeak.current = now; setLeaks((l) => [...l, { prompt: p, unit: moved[0][0] }]) }
  }, [units, phase, p])

  const leakWord = (n) => t([n === 1 ? 'leak' : 'leaks', 'دزەکردن'])
  return (
    <div className="poker">
      {phase === 'idle' && (
        <>
          <h2 className="display perform-name">{t(['Keep a poker face.', 'دەموچاوت بێهەست ڕابگرە.'])}</h2>
          <p className="perform-hint">{t(['Six lines will appear, one every few seconds. Read each one and keep your face perfectly still. The Mirror counts every movement that slips out, and tells you which muscle gave you away.', 'شەش ڕستە دەردەکەون، هەر چەند چرکەیەک یەکێک. هەر یەکێک بخوێنەوە و دەموچاوت بە تەواوی بێجووڵە ڕابگرە. ئاوێنەکە هەموو ئەو جووڵانە دەژمێرێت کە دزە دەکەن، و پێت دەڵێت کام ماسولکە ئاشکرای کردیت.'])}</p>
          {demo && <p className="perform-state ui">{t(['This one needs your camera.', 'ئەمە پێویستی بە کامێراکەتە.'])}</p>}
          <button className="btn btn-light cursor-target" onClick={() => setPhase('baseline')} disabled={demo}>{t(['Start', 'دەست پێبکە'])}</button>
        </>
      )}
      {phase === 'baseline' && (
        <>
          <h2 className="display perform-name">{t(['Relax your face.', 'دەموچاوت ئارام بکەرەوە.'])}</h2>
          <p className="perform-hint">{t(['Learning what your face looks like at rest…', 'فێردەبێت دەموچاوت لە پشوودا چۆنە…'])}</p>
          <span className="poker-timer" style={{ animationDuration: '3s' }} />
        </>
      )}
      {phase === 'prompts' && (
        <>
          <p className="perform-count ui">{t([`${p + 1} of ${order.length}`, `${t.n(p + 1)} لە ${t.n(order.length)}`])} · <span className={leaks.length ? 'leaky' : ''}>{t.n(leaks.length)} {leakWord(leaks.length)}</span></p>
          <p className="display poker-prompt" key={p}>{prompts[order[p]]}</p>
          <span className="poker-timer" key={`t${p}`} />
        </>
      )}
      {phase === 'result' && (
        <>
          <p className="poker-score display"><span>{t.n(leaks.length)}</span><small>{leakWord(leaks.length)}</small></p>
          <p className="perform-hint">{leaks.length === 0 ? t(['Nothing got out. A real poker face.', 'هیچ شتێک دەرنەچوو. دەموچاوێکی بێهەستی ڕاستەقینە.']) : t(['Faces leak in the first half-second, before you have time to stop them. This is what gave you away:', 'دەموچاو لە یەکەم نیو چرکەدا دزە دەکات، پێش ئەوەی کاتت هەبێت ڕایبگریت. ئەمە ئەوەیە کە ئاشکرای کردیت:'])}</p>
          <ol className="poker-list">
            {order.map((idx, k) => {
              const leak = leaks.find((l) => l.prompt === k)
              return <li key={k}><span className="poker-list-prompt">{prompts[idx]}</span><span className={`ui ${leak ? 'leaked' : ''}`} lang={leak ? 'la' : undefined}>{leak ? leak.unit.muscle : t(['Nothing moved', 'هیچ نەجووڵا'])}</span></li>
            })}
          </ol>
          <button className="btn btn-ghost cursor-target" onClick={() => { setRound((r) => r + 1); setPhase('idle') }}>{t(['Try again', 'دووبارە هەوڵ بدەرەوە'])}</button>
        </>
      )}
    </div>
  )
}
