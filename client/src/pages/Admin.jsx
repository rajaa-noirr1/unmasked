// The admin page (/admin): sign in, then add, change, reorder or delete what the website shows.
//   Overview   what is in the database, what visitors did, the hardest questions, the latest changes
//   The tests  questions with their photo, options, right answer and explanation
//   The Map    each part of the body: its words, and the signals it gives
//   The Mirror the Rehearse situations and the Poker face lines
// Every text is written twice, English and Kurdish; an empty Kurdish field shows the English until
// someone translates it. Accounts are made on the laptop: npm run admin:create. The work is done by
// the API (server/src/admin.js); this page only shows it. On GitHub Pages there is no API, so it says so.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useTitle } from '../lib/hooks'
import { admin, ENABLED } from '../lib/api'
import { refreshContent } from '../i18n/data'
import { asset } from '../lib/asset'
import EyeStrip from '../components/EyeStrip'
import Photo from '../components/Photo'
import Silhouette, { SCENES } from '../components/Silhouette'
import { POSES } from '../data/poses'

const TABS = [
  { id: 'overview', name: ['Overview', 'پوختە'] },
  { id: 'tests', name: ['The tests', 'تاقیکردنەوەکان'] },
  { id: 'map', name: ['The Map', 'نەخشەکە'] },
  { id: 'mirror', name: ['The Mirror', 'ئاوێنەکە'] },
]

// a call that ends the session (401) signs the page out
const Session = createContext({ expired: () => {} })

export default function Admin() {
  const t = useT()
  useTitle(t(['Admin', 'بەڕێوەبەر']))
  const [me, setMe] = useState(undefined) // undefined: checking · null: signed out · 'name': signed in
  const [tab, setTab] = useState('overview')
  useEffect(() => {
    if (!ENABLED) return
    admin.me().then((r) => setMe(r.username)).catch(() => setMe(null))
  }, [])
  const expired = useCallback(() => setMe(null), [])
  const signOut = async () => { await admin.logout().catch(() => {}); setMe(null) }

  return (
    <div className="page admin">
      <div className="wrap">
        <header className="ad-head">
          <p className="label">{t(['Unmasked · admin', 'Unmasked · بەڕێوەبەر'])}</p>
          <h1 className="display ad-title">{t(['The back room', 'ژووری پشتەوە'])}</h1>
          {me && (
            <p className="ad-who ui">
              {t(['Signed in as', 'چوویتە ژوورەوە وەک'])} <b>{me}</b>
              <button className="link-line cursor-target" onClick={signOut}>{t(['Sign out', 'چوونەدەرەوە'])}</button>
            </p>
          )}
        </header>

        {!ENABLED ? (
          <p className="ad-note ui">
            {t(['This copy of the site has no database behind it (GitHub Pages). The admin page works on the laptop version: run', 'ئەم کۆپییەی ماڵپەڕەکە داتابەیسی لە پشتەوە نییە (GitHub Pages). پەڕەی بەڕێوەبەر لەسەر وەشانی لاپتۆپەکە کار دەکات: لێبدە'])}{' '}
            <code>npm run dev</code>{t([', then open ', '، پاشان بکەرەوە '])}<code>localhost:5180/admin</code>.
          </p>
        ) : me === undefined ? (
          <p className="state">{t(['Checking…', 'پشکنین…'])}</p>
        ) : !me ? (
          <SignIn onIn={setMe} />
        ) : (
          <Session.Provider value={{ expired }}>
            <nav className="ad-tabs" aria-label={t(['Admin sections', 'بەشەکانی بەڕێوەبەر'])}>
              {TABS.map((x) => (
                <button key={x.id} className={`chip cursor-target ${tab === x.id ? 'on' : ''}`} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>{t(x.name)}</button>
              ))}
            </nav>
            {tab === 'overview' && <Overview />}
            {tab === 'tests' && <Tests />}
            {tab === 'map' && <MapTab />}
            {tab === 'mirror' && <MirrorTab />}
          </Session.Provider>
        )}
      </div>
    </div>
  )
}

// ── signing in ──
function SignIn({ onIn }) {
  const t = useT()
  const [name, setName] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { onIn((await admin.login(name, pass)).username) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <form className="ad-signin" onSubmit={submit}>
      <label className="ad-field"><span className="ad-label ui">{t(['Username', 'ناوی بەکارهێنەر'])}</span>
        <input dir="ltr" autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></label>
      <label className="ad-field"><span className="ad-label ui">{t(['Password', 'وشەی نهێنی'])}</span>
        <input dir="ltr" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
      {error && <p className="ad-error ui" role="alert">{error}</p>}
      <button className="btn btn-light cursor-target" disabled={busy}>{busy ? t(['Signing in…', 'چوونەژوورەوە…']) : t(['Sign in', 'چوونەژوورەوە'])}</button>
      <p className="ad-hint ui">{t(['No account yet? On the laptop, in the project folder, run', 'هێشتا هەژمارت نییە؟ لەسەر لاپتۆپەکە، لە بوخچەی پرۆژەکەدا، لێبدە'])} <code>npm run admin:create</code>.</p>
    </form>
  )
}

// ── shared pieces ──

// load one admin address; reload() after a change
function useLoad(path) {
  const { expired } = useContext(Session)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    try { setData(await admin.get(path)); setError('') } catch (e) { if (e.status === 401) expired(); else setError(e.message) }
  }, [path, expired])
  useEffect(() => { reload() }, [reload])
  return { data, error, reload }
}

// run a change: busy while it runs, the server's reason if it is refused, signed out on 401
function useRun() {
  const { expired } = useContext(Session)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = useCallback(async (fn) => {
    setBusy(true); setError('')
    try { return { ok: true, value: await fn() } } catch (e) {
      if (e.status === 401) expired(); else setError(e.message)
      return { ok: false }
    } finally { setBusy(false) }
  }, [expired])
  return { busy, error, run }
}

const blank = (fields) => ({ en: Object.fromEntries(fields.map((f) => [f, ''])), ckb: Object.fromEntries(fields.map((f) => [f, ''])) })
// a Kurdish text that is only a copy of the English shows as empty, so it keeps following the English
const fill = (fields, texts) => {
  const b = blank(fields)
  for (const f of fields) {
    b.en[f] = texts?.en?.[f] ?? ''
    const k = texts?.ckb?.[f] ?? ''
    b.ckb[f] = k === b.en[f] ? '' : k
  }
  return b
}
function useTexts(fields, initial) {
  const [texts, setTexts] = useState(() => fill(fields, initial))
  const set = (lang, field, v) => setTexts((o) => ({ ...o, [lang]: { ...o[lang], [field]: v } }))
  return [texts, set, setTexts]
}

// one text in both languages, side by side
function BiField({ label, field, texts, set, area = false, optional = false, max = 400, hint }) {
  const t = useT()
  const Tag = area ? 'textarea' : 'input'
  const name = t(label)
  return (
    <div className="ad-field">
      <span className="ad-label ui">{name}{!optional && <span className="ad-need" aria-hidden="true"> *</span>}</span>
      <div className="ad-pair">
        <Tag dir="ltr" lang="en" aria-label={`${name}, English`} rows={area ? 3 : undefined} maxLength={max} required={!optional}
          value={texts.en[field]} onChange={(e) => set('en', field, e.target.value)} />
        <Tag dir="rtl" lang="ckb" aria-label={`${name}, کوردی`} rows={area ? 3 : undefined} maxLength={max}
          placeholder={t(['Kurdish: empty shows the English', 'کوردی: ئەگەر بەتاڵ بێت ئینگلیزییەکە دەردەکەوێت'])}
          value={texts.ckb[field]} onChange={(e) => set('ckb', field, e.target.value)} />
      </div>
      {hint && <p className="ad-hint ui">{t(hint)}</p>}
    </div>
  )
}

// a form for one thing, with Save and Cancel
function Editor({ title, onSave, onCancel, busy, error, children }) {
  const t = useT()
  const submit = (e) => { e.preventDefault(); onSave() }
  return (
    <form className="ad-editor" onSubmit={submit}>
      <h3 className="display ad-editor-title">{title}</h3>
      {children}
      {error && <p className="ad-error ui" role="alert">{error}</p>}
      <div className="ad-editor-foot">
        <button className="btn btn-light cursor-target" disabled={busy}>{busy ? t(['Saving…', 'پاشەکەوت دەکرێت…']) : t(['Save', 'پاشەکەوت'])}</button>
        <button type="button" className="btn btn-ghost cursor-target" onClick={onCancel}>{t(['Cancel', 'پاشگەزبوونەوە'])}</button>
        <span className="ad-hint ui">{t(['* English is required.', '* ئینگلیزی پێویستە.'])}</span>
      </div>
    </form>
  )
}

// up, down, edit, delete for one row
function Actions({ label, onUp, onDown, onEdit, onDelete, busy }) {
  const t = useT()
  return (
    <span className="ad-actions">
      <button type="button" className="ad-icon cursor-target" disabled={busy || !onUp} onClick={onUp} aria-label={`${t(['Move up', 'بۆ سەرەوە'])}: ${label}`} title={t(['Move up', 'بۆ سەرەوە'])}>↑</button>
      <button type="button" className="ad-icon cursor-target" disabled={busy || !onDown} onClick={onDown} aria-label={`${t(['Move down', 'بۆ خوارەوە'])}: ${label}`} title={t(['Move down', 'بۆ خوارەوە'])}>↓</button>
      <button type="button" className="ad-small cursor-target" disabled={busy} onClick={onEdit}>{t(['Edit', 'دەستکاری'])}</button>
      {onDelete && <button type="button" className="ad-small ad-danger cursor-target" disabled={busy} onClick={onDelete}>{t(['Delete', 'سڕینەوە'])}</button>}
    </span>
  )
}

function Waiting({ error }) {
  const t = useT()
  return error ? <p className="ad-error ui" role="alert">{error}</p> : <p className="state">{t(['Loading…', 'بارکردن…'])}</p>
}

const when = (iso, lang) => new Intl.DateTimeFormat(lang === 'ckb' ? 'ckb-IQ' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

// ── overview ──
function Overview() {
  const t = useT()
  const { data, error } = useLoad('/overview')
  if (!data) return <Waiting error={error} />
  const c = data.counts, a = data.activity
  const tiles = [
    [c.questions, ['questions in 3 tests', 'پرسیار لە ٣ تاقیکردنەوەدا']],
    [c.signals, ['signals on the Map', 'ئاماژە لە نەخشەکەدا']],
    [c.scenarios, ['Rehearse situations', 'دۆخی ڕاهێنان']],
    [c.body_parts, ['parts of the body', 'بەشی جەستە']],
    [a.visitors_week, ['visitors this week', 'سەردانکەر لەم هەفتەیەدا']],
    [a.tests_finished, ['tests finished', 'تاقیکردنەوەی تەواوکراو']],
    [a.answers, ['answers given', 'وەڵامی دراو']],
    [a.rehearsals, ['rehearsals saved', 'ڕاهێنانی پاشەکەوتکراو']],
  ]
  const ACTION = { add: ['added', 'زیادی کرد'], edit: ['changed', 'گۆڕی'], delete: ['deleted', 'سڕییەوە'], move: ['moved', 'جوڵاندی'] }
  return (
    <div className="ad-overview">
      <ul className="ad-tiles" role="list">
        {tiles.map(([n, label]) => <li key={label[0]}><b className="display">{t.n(n)}</b><span className="ui">{t(label)}</span></li>)}
      </ul>
      <section className="ad-block">
        <h2 className="ad-block-title display">{t(['The hardest questions', 'سەختترین پرسیارەکان'])}</h2>
        {data.hardest.length ? (
          <ol className="ad-list">
            {data.hardest.map((h) => (
              <li key={h.id} className="ad-item"><span className="ad-item-main"><b>{h.title}</b> <span className="muted ui">{h.test} · {h.question}</span></span>
                <span className="ad-stat ui">{t([`${h.percent_correct}% right of ${h.answers}`, `٪${t.n(h.percent_correct)} ڕاست لە ${t.n(h.answers)}`])}</span></li>
            ))}
          </ol>
        ) : <p className="ad-hint ui">{t(['Nobody has answered a question yet.', 'هێشتا کەس وەڵامی هیچ پرسیارێکی نەداوەتەوە.'])}</p>}
      </section>
      <section className="ad-block">
        <h2 className="ad-block-title display">{t(['Latest changes', 'دوایین گۆڕانکارییەکان'])}</h2>
        {data.changes.length ? (
          <ol className="ad-list">
            {data.changes.map((x, i) => (
              <li key={i} className="ad-item"><span className="ad-item-main"><b>{x.username || '—'}</b> {t(ACTION[x.action])} <span className="muted">{x.kind}</span> <span lang="en">{x.target}</span></span>
                <span className="ad-stat ui">{when(x.at, t.lang)}</span></li>
            ))}
          </ol>
        ) : <p className="ad-hint ui">{t(['Nothing has been changed from here yet.', 'هێشتا هیچ شتێک لێرەوە نەگۆڕدراوە.'])}</p>}
      </section>
    </div>
  )
}

// ── the tests ──
function Tests() {
  const t = useT()
  const { data, error, reload } = useLoad('/tests')
  const { busy, error: actError, run } = useRun()
  const [editing, setEditing] = useState(null) // { test, id? }
  if (!data) return <Waiting error={error} />
  const changed = async () => { await reload(); refreshContent() }
  if (editing) return <QuestionEditor {...editing} onDone={async (saved) => { setEditing(null); if (saved) await changed() }} />
  const move = (id, by) => run(() => admin.move('questions', id, by)).then((r) => r.ok && changed())
  const remove = (q) => {
    const also = q.answers ? t([` The ${q.answers} answers people gave to it are deleted too.`, ` ئەو ${t.n(q.answers)} وەڵامەی خەڵک دابوویانەوە ئەوانیش دەسڕدرێنەوە.`]) : ''
    if (!window.confirm(t([`Delete “${q.title}”?`, `«${q.title}» بسڕدرێتەوە؟`]) + also + t([' This cannot be undone.', ' ناگەڕێتەوە.']))) return
    run(() => admin.remove('questions', q.id)).then((r) => r.ok && changed())
  }
  return (
    <div>
      {actError && <p className="ad-error ui" role="alert">{actError}</p>}
      {data.map((test) => (
        <section key={test.slug} className="ad-block">
          <header className="ad-block-head">
            <h2 className="ad-block-title display">{t([test.name.en, test.name.ckb])}</h2>
            <span className="ui muted">{t([`${test.questions.length} questions`, `${t.n(test.questions.length)} پرسیار`])}</span>
            <button className="btn btn-ghost ad-add cursor-target" onClick={() => setEditing({ test })}>{t(['+ Add a question', '+ پرسیارێک زیاد بکە'])}</button>
          </header>
          <ol className="ad-list">
            {test.questions.map((q, i) => (
              <li key={q.id} className="ad-item">
                <span className="ad-n ui">{t.n(i + 1)}</span>
                <span className="ad-item-main"><b>{q.title}</b> <span className="muted">{q.prompt}</span></span>
                <span className="ad-stat ui">{q.answers ? t([`${q.percent}% right · ${q.answers}`, `٪${t.n(q.percent)} ڕاست · ${t.n(q.answers)}`]) : t(['no answers yet', 'هێشتا وەڵام نییە'])}</span>
                <Actions label={q.title} busy={busy}
                  onUp={i > 0 ? () => move(q.id, -1) : null} onDown={i < test.questions.length - 1 ? () => move(q.id, 1) : null}
                  onEdit={() => setEditing({ test, id: q.id })} onDelete={test.questions.length > 1 ? () => remove(q) : null} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

const Q_FIELDS = ['prompt', 'title', 'cue', 'why', 'place', 'credit']
const DEFAULT_CROP = { x: 0.25, y: 0.3, w: 0.5, h: 0.16 }
const DEFAULT_VEIL = { x: 0.5, y: 0.2, r: 0.14 }

function QuestionEditor({ test, id, onDone }) {
  const t = useT()
  const { busy, error, run } = useRun()
  const [ready, setReady] = useState(false)
  const [texts, setText, setTexts] = useTexts(Q_FIELDS, null)
  const [options, setOptions] = useState([{ en: '', ckb: '' }, { en: '', ckb: '' }, { en: '', ckb: '' }, { en: '', ckb: '' }])
  const [answer, setAnswer] = useState(0)
  const [photo, setPhoto] = useState({ file: '', who: '', crop: null, veil: null })
  const [pose, setPose] = useState('neutral')
  const [scene, setScene] = useState('none')
  const [widened, setWidened] = useState(false)
  const kind = test.kind

  // an existing question comes from the database; a new one starts with the question line and credit of the test's last one
  useEffect(() => {
    const from = id || test.questions.at(-1)?.id
    if (!from) { setReady(true); return }
    run(() => admin.get(`/questions/${from}`)).then((r) => {
      if (!r.ok) return
      const q = r.value
      if (id) {
        setTexts(fill(Q_FIELDS, q.texts))
        setOptions(q.options.map((o) => ({ en: o.en, ckb: o.ckb === o.en ? '' : o.ckb })))
        setAnswer(Math.max(0, q.options.findIndex((o) => o.correct)))
        setPhoto({ file: q.photo_file, who: q.photo_who, crop: q.photo_frame?.crop ?? null, veil: q.photo_frame?.veil ?? null })
        setPose(q.pose || 'neutral'); setScene(q.scene || 'none')
      } else {
        setTexts(fill(Q_FIELDS, { en: { prompt: q.texts.en.prompt, credit: q.texts.en.credit }, ckb: { prompt: q.texts.ckb.prompt, credit: q.texts.ckb.credit } }))
        if (kind === 'eyes') setOptions([0, 1, 2, 3].map(() => ({ en: '', ckb: '' })))
      }
      setReady(true)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setOpt = (i, lang, v) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, [lang]: v } : x)))
  const dropOpt = (i) => { setOptions((o) => o.filter((_, j) => j !== i)); setAnswer((a) => (a === i ? 0 : a > i ? a - 1 : a)) }
  const upload = async (file) => {
    if (!file) return
    const r = await run(() => admin.photo(file))
    if (r.ok) setPhoto((p) => ({ ...p, file: r.value.file }))
  }
  const save = async () => {
    const body = { test: test.slug, texts, options, answer, pose, scene, photo: { file: photo.file, who: photo.who, crop: kind === 'eyes' ? photo.crop : null, veil: kind === 'body' ? photo.veil : null } }
    const r = await run(() => (id ? admin.save('questions', id, body) : admin.add('questions', body)))
    if (r.ok) onDone(true)
  }
  if (!ready) return <Waiting error={error} />

  const src = photo.file ? asset(photo.file) : ''
  const num = (group, key, v) => setPhoto((p) => ({ ...p, [group]: { ...p[group], [key]: v === '' ? '' : Number(v) } }))
  const title = id ? t([`Edit a question in ${test.name.en}`, `دەستکاریکردنی پرسیارێک لە ${test.name.ckb}`]) : t([`A new question for ${test.name.en}`, `پرسیارێکی نوێ بۆ ${test.name.ckb}`])

  return (
    <Editor title={title} onSave={save} onCancel={() => onDone(false)} busy={busy} error={error}>
      <div className="ad-photo">
        <div className="ad-photo-view">
          {kind === 'eyes' && (src
            ? <><EyeStrip image={{ src, file: photo.file, crop: photo.crop }} widened={widened} />
                <button type="button" className="ad-small cursor-target" onClick={() => setWidened((w) => !w)}>{widened ? t(['Show the strip', 'پارچەکە پیشان بدە']) : t(['Show the whole photo', 'هەموو وێنەکە پیشان بدە'])}</button></>
            : <p className="ad-hint ui">{t(['No photo yet: the test shows “Photo needed” until one is added.', 'هێشتا وێنە نییە: تاقیکردنەوەکە «وێنە پێویستە» پیشان دەدات تا وێنەیەک زیاد دەکرێت.'])}</p>)}
          {kind === 'body' && (src ? <Photo image={{ src, file: photo.file, veil: photo.veil }} /> : <p className="ad-hint ui">{t(['No photo yet: the test shows “Photo needed” until one is added.', 'هێشتا وێنە نییە: تاقیکردنەوەکە «وێنە پێویستە» پیشان دەدات تا وێنەیەک زیاد دەکرێت.'])}</p>)}
          {kind === 'context' && (src
            ? <Photo image={{ src, file: photo.file }} fill fallback={<Silhouette pose={pose} scene={scene} />} />
            : <Silhouette pose={pose} scene={scene} />)}
        </div>
        <div className="ad-photo-fields">
          <label className="ad-field"><span className="ad-label ui">{t(['Photo', 'وێنە'])}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} disabled={busy} />
          </label>
          <label className="ad-field"><span className="ad-label ui">{t(['…or a file already in client/public', '…یان فایلێک کە لە client/public دایە'])}</span>
            <input dir="ltr" value={photo.file} placeholder={`images/${kind}/name`} onChange={(e) => setPhoto((p) => ({ ...p, file: e.target.value.trim() }))} />
          </label>
          <label className="ad-field"><span className="ad-label ui">{t(['Who is in it (shown after the answer)', 'کێ تێیدایە (دوای وەڵام پیشان دەدرێت)'])}</span>
            <input dir="ltr" value={photo.who} onChange={(e) => setPhoto((p) => ({ ...p, who: e.target.value }))} />
          </label>
          {kind === 'eyes' && (
            <fieldset className="ad-nums">
              <legend className="ad-label ui"><label><input type="checkbox" checked={!!photo.crop} onChange={(e) => setPhoto((p) => ({ ...p, crop: e.target.checked ? DEFAULT_CROP : null }))} /> {t(['Frame the eye strip by hand (parts of the photo, 0 to 1)', 'پارچەی چاوەکان بە دەست دیاری بکە (بەشێک لە وێنە، ٠ تا ١)'])}</label></legend>
              {photo.crop && ['x', 'y', 'w', 'h'].map((k) => (
                <label key={k}><span className="ui">{k}</span><input type="number" min="0" max="1" step="0.005" value={photo.crop[k]} onChange={(e) => num('crop', k, e.target.value)} /></label>
              ))}
            </fieldset>
          )}
          {kind === 'body' && (
            <fieldset className="ad-nums">
              <legend className="ad-label ui"><label><input type="checkbox" checked={!!photo.veil} onChange={(e) => setPhoto((p) => ({ ...p, veil: e.target.checked ? DEFAULT_VEIL : null }))} /> {t(['Blur the face until the answer', 'دەموچاو تا وەڵامدانەوە لێڵ بکە'])}</label></legend>
              {photo.veil && ['x', 'y', 'r'].map((k) => (
                <label key={k}><span className="ui">{k}</span><input type="number" min="0" max={k === 'r' ? 0.5 : 1} step="0.005" value={photo.veil[k]} onChange={(e) => num('veil', k, e.target.value)} /></label>
              ))}
            </fieldset>
          )}
          {kind === 'context' && (
            <div className="ad-two">
              <label className="ad-field"><span className="ad-label ui">{t(['Pose (drawn until a photo is there)', 'شێوەی وەستان (تا وێنە دێت دەکێشرێت)'])}</span>
                <select value={pose} onChange={(e) => setPose(e.target.value)}>{Object.keys(POSES).map((p) => <option key={p}>{p}</option>)}</select></label>
              <label className="ad-field"><span className="ad-label ui">{t(['Scene', 'دیمەن'])}</span>
                <select value={scene} onChange={(e) => setScene(e.target.value)}>{Object.keys(SCENES).map((s) => <option key={s}>{s}</option>)}</select></label>
            </div>
          )}
        </div>
      </div>

      <BiField label={['Question', 'پرسیار']} field="prompt" texts={texts} set={setText} max={300} />
      {kind === 'context' && <BiField label={['Where it happens', 'لە کوێ ڕوودەدات']} field="place" texts={texts} set={setText} max={200} optional />}

      <div className="ad-field">
        <span className="ad-label ui">{t(['Options: tick the right one', 'هەڵبژاردنەکان: ڕاستەکە دیاری بکە'])}<span className="ad-need" aria-hidden="true"> *</span></span>
        {options.map((o, i) => (
          <div key={i} className={`ad-option ${answer === i ? 'right' : ''}`}>
            <label className="ad-right" title={t(['The right answer', 'وەڵامی ڕاست'])}>
              <input type="radio" name="answer" checked={answer === i} onChange={() => setAnswer(i)} />
              <span className="sr-only">{t(['The right answer', 'وەڵامی ڕاست'])} {i + 1}</span>
            </label>
            <input dir="ltr" lang="en" aria-label={`Option ${i + 1}, English`} value={o.en} onChange={(e) => setOpt(i, 'en', e.target.value)} required maxLength={160} />
            <input dir="rtl" lang="ckb" aria-label={`هەڵبژاردنی ${i + 1}، کوردی`} value={o.ckb} onChange={(e) => setOpt(i, 'ckb', e.target.value)} maxLength={160} placeholder={t(['Kurdish', 'کوردی'])} />
            <button type="button" className="ad-icon cursor-target" disabled={options.length <= 2} onClick={() => dropOpt(i)} aria-label={t(['Remove this option', 'ئەم هەڵبژاردنە لابەرە'])}>×</button>
          </div>
        ))}
        {options.length < 6 && <button type="button" className="ad-small cursor-target" onClick={() => setOptions((o) => [...o, { en: '', ckb: '' }])}>{t(['+ Another option', '+ هەڵبژاردنێکی تر'])}</button>}
        <p className="ad-hint ui">{t(['The site shows them in a new random order each time.', 'ماڵپەڕەکە هەر جارێک بە ڕیزبەندییەکی هەڕەمەکیی نوێ پیشانیان دەدات.'])}</p>
      </div>

      <BiField label={['Heading after the answer', 'سەردێڕ دوای وەڵام']} field="title" texts={texts} set={setText} max={160} hint={['The name of the right reading, e.g. Suspicion.', 'ناوی خوێندنەوە ڕاستەکە، بۆ نموونە گومان.']} />
      <BiField label={['Look at', 'سەیری ئەمە بکە']} field="cue" texts={texts} set={setText} area max={800} hint={['The cues that decide it.', 'ئەو ئاماژانەی بڕیار دەدەن.']} />
      <BiField label={['Why not the others', 'بۆچی ئەوانی تر نا']} field="why" texts={texts} set={setText} area max={1200} />
      <BiField label={['Photo credit', 'سەرچاوەی وێنە']} field="credit" texts={texts} set={setText} max={300} optional />
    </Editor>
  )
}

// ── the Map ──
const PART_FIELDS = ['name', 'short_name', 'line', 'feels']
const SIGNAL_FIELDS = ['tell', 'means', 'context']

function MapTab() {
  const t = useT()
  const { data, error, reload } = useLoad('/map')
  const { busy, error: actError, run } = useRun()
  const [open, setOpen] = useState(null)
  const [editing, setEditing] = useState(null) // { part } | { part, signal } | { part, newSignal: true }
  if (!data) return <Waiting error={error} />
  const changed = async () => { await reload(); refreshContent() }
  const done = async (saved) => { setEditing(null); if (saved) await changed() }
  const label = (code) => { const e = data.evidence.find((x) => x.code === code); return e ? t([e.label.en, e.label.ckb]) : code }

  if (editing?.signal || editing?.newSignal) return <SignalEditor part={editing.part} signal={editing.signal} evidence={data.evidence} onDone={done} />
  if (editing) return <PartEditor part={editing.part} onDone={done} />

  const move = (id, by) => run(() => admin.move('signals', id, by)).then((r) => r.ok && changed())
  const remove = (s) => {
    if (!window.confirm(t([`Delete the signal “${s.texts.en.tell}”? This cannot be undone.`, `ئاماژەی «${s.texts.ckb.tell}» بسڕدرێتەوە؟ ناگەڕێتەوە.`]))) return
    run(() => admin.remove('signals', s.id)).then((r) => r.ok && changed())
  }
  return (
    <div>
      {actError && <p className="ad-error ui" role="alert">{actError}</p>}
      <ul className="ad-parts" role="list">
        {data.parts.map((p) => (
          <li key={p.id} className={`ad-part ${p.parent ? 'child' : ''} ${open === p.id ? 'open' : ''}`}>
            <button className="ad-part-head cursor-target" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>
              <b className="display">{t([p.texts.en.name, p.texts.ckb.name])}</b>
              <span className="ui muted">{t([`${p.signals.length} signals`, `${t.n(p.signals.length)} ئاماژە`])}</span>
            </button>
            {open === p.id && (
              <div className="ad-part-body">
                <p className="ad-part-line">{t([p.texts.en.line, p.texts.ckb.line])}
                  <button className="ad-small cursor-target" onClick={() => setEditing({ part: p })}>{t(['Edit its words', 'دەستکاریی وشەکانی']) }</button></p>
                <ol className="ad-list">
                  {p.signals.map((s, i) => (
                    <li key={s.id} className="ad-item">
                      <span className="ad-n ui">{t.n(i + 1)}</span>
                      <span className="ad-item-main"><b>{t([s.texts.en.tell, s.texts.ckb.tell])}</b> <span className="muted">{t([s.texts.en.means, s.texts.ckb.means])}</span></span>
                      <span className={`ad-stat ad-ev ev-${s.evidence} ui`}>{label(s.evidence)}</span>
                      <Actions label={s.texts.en.tell} busy={busy}
                        onUp={i > 0 ? () => move(s.id, -1) : null} onDown={i < p.signals.length - 1 ? () => move(s.id, 1) : null}
                        onEdit={() => setEditing({ part: p, signal: s })} onDelete={() => remove(s)} />
                    </li>
                  ))}
                </ol>
                <button className="btn btn-ghost ad-add cursor-target" onClick={() => setEditing({ part: p, newSignal: true })}>{t(['+ Add a signal', '+ ئاماژەیەک زیاد بکە'])}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PartEditor({ part, onDone }) {
  const t = useT()
  const { busy, error, run } = useRun()
  const [texts, set] = useTexts(PART_FIELDS, part.texts)
  const save = async () => { if ((await run(() => admin.save('body-parts', part.id, { texts }))).ok) onDone(true) }
  return (
    <Editor title={t([`The words for ${part.texts.en.name}`, `وشەکانی ${part.texts.ckb.name}`])} onSave={save} onCancel={() => onDone(false)} busy={busy} error={error}>
      <BiField label={['Name', 'ناو']} field="name" texts={texts} set={set} max={80} />
      <BiField label={['Short name (on the figure)', 'ناوی کورت (لەسەر وێنەکە)']} field="short_name" texts={texts} set={set} max={40} />
      <BiField label={['One line under the name', 'یەک دێڕ لە ژێر ناوەکە']} field="line" texts={texts} set={set} area max={300} />
      <BiField label={['What it feels, from the inside', 'لە ناوەوە چی هەست دەکات']} field="feels" texts={texts} set={set} area max={800} />
    </Editor>
  )
}

function SignalEditor({ part, signal, evidence, onDone }) {
  const t = useT()
  const { busy, error, run } = useRun()
  const [texts, set] = useTexts(SIGNAL_FIELDS, signal?.texts)
  const [ev, setEv] = useState(signal?.evidence || 'mixed')
  const save = async () => {
    const body = { part: part.id, evidence: ev, texts }
    if ((await run(() => (signal ? admin.save('signals', signal.id, body) : admin.add('signals', body)))).ok) onDone(true)
  }
  return (
    <Editor title={signal ? t([`Edit a signal of ${part.texts.en.name}`, `دەستکاریی ئاماژەیەکی ${part.texts.ckb.name}`]) : t([`A new signal for ${part.texts.en.name}`, `ئاماژەیەکی نوێ بۆ ${part.texts.ckb.name}`])}
      onSave={save} onCancel={() => onDone(false)} busy={busy} error={error}>
      <BiField label={['What you see', 'ئەوەی دەیبینیت']} field="tell" texts={texts} set={set} max={200} hint={['e.g. Raised and held', 'بۆ نموونە بەرزکراوە و ڕاگیراو']} />
      <BiField label={['What it usually means', 'زۆرجار مانای چییە']} field="means" texts={texts} set={set} area max={400} />
      <BiField label={['What else it can mean, and when', 'چی تر دەکرێت مانای بێت، و کەی']} field="context" texts={texts} set={set} area max={800} />
      <fieldset className="ad-field ad-evidence">
        <legend className="ad-label ui">{t(['How well the research supports it', 'توێژینەوە چەند پشتگیری دەکات'])}</legend>
        {evidence.map((e) => (
          <label key={e.code} className={`chip cursor-target ${ev === e.code ? 'on' : ''}`}>
            <input type="radio" name="evidence" className="sr-only" checked={ev === e.code} onChange={() => setEv(e.code)} />{t([e.label.en, e.label.ckb])}
          </label>
        ))}
      </fieldset>
    </Editor>
  )
}

// ── the Mirror ──
function MirrorTab() {
  const t = useT()
  const { data, error, reload } = useLoad('/mirror')
  const { busy, error: actError, run } = useRun()
  const [editing, setEditing] = useState(null) // { what: 'scenarios' | 'prompts', item? }
  if (!data) return <Waiting error={error} />
  const changed = async () => { await reload(); refreshContent() }
  const done = async (saved) => { setEditing(null); if (saved) await changed() }
  if (editing?.what === 'scenarios') return <ScenarioEditor item={editing.item} onDone={done} />
  if (editing?.what === 'prompts') return <PromptEditor item={editing.item} onDone={done} />

  const move = (what, id, by) => run(() => admin.move(what, id, by)).then((r) => r.ok && changed())
  const remove = (what, item, name, extra = '') => {
    if (!window.confirm(t([`Delete “${name}”?`, `«${name}» بسڕدرێتەوە؟`]) + extra + t([' This cannot be undone.', ' ناگەڕێتەوە.']))) return
    run(() => admin.remove(what, item.id)).then((r) => r.ok && changed())
  }
  return (
    <div>
      {actError && <p className="ad-error ui" role="alert">{actError}</p>}
      <section className="ad-block">
        <header className="ad-block-head">
          <h2 className="ad-block-title display">{t(['Rehearse: the situations', 'ڕاهێنان: دۆخەکان'])}</h2>
          <button className="btn btn-ghost ad-add cursor-target" onClick={() => setEditing({ what: 'scenarios' })}>{t(['+ Add a situation', '+ دۆخێک زیاد بکە'])}</button>
        </header>
        <ol className="ad-list">
          {data.scenarios.map((s, i) => (
            <li key={s.id} className="ad-item">
              <span className="ad-n ui">{t.n(i + 1)}</span>
              <span className="ad-item-main"><b>{t([s.texts.en.name, s.texts.ckb.name])}</b> <span className="muted">“{t([s.texts.en.prompt, s.texts.ckb.prompt])}”</span></span>
              <span className="ad-stat ui">{t([`${s.rehearsals} rehearsals`, `${t.n(s.rehearsals)} ڕاهێنان`])}</span>
              <Actions label={s.texts.en.name} busy={busy}
                onUp={i > 0 ? () => move('scenarios', s.id, -1) : null} onDown={i < data.scenarios.length - 1 ? () => move('scenarios', s.id, 1) : null}
                onEdit={() => setEditing({ what: 'scenarios', item: s })}
                onDelete={data.scenarios.length > 1 ? () => remove('scenarios', s, s.texts.en.name, s.rehearsals ? t([` Its ${s.rehearsals} saved rehearsals are deleted too.`, ` ${t.n(s.rehearsals)} ڕاهێنانی پاشەکەوتکراوی ئەویش دەسڕدرێنەوە.`]) : '') : null} />
            </li>
          ))}
        </ol>
      </section>
      <section className="ad-block">
        <header className="ad-block-head">
          <h2 className="ad-block-title display">{t(['Poker face: the lines', 'دەموچاوی پۆکەر: ڕستەکان'])}</h2>
          <button className="btn btn-ghost ad-add cursor-target" onClick={() => setEditing({ what: 'prompts' })}>{t(['+ Add a line', '+ ڕستەیەک زیاد بکە'])}</button>
        </header>
        <ol className="ad-list">
          {data.prompts.map((p, i) => (
            <li key={p.id} className="ad-item">
              <span className="ad-n ui">{t.n(i + 1)}</span>
              <span className="ad-item-main">“{t([p.texts.en.text, p.texts.ckb.text])}”</span>
              <Actions label={p.texts.en.text} busy={busy}
                onUp={i > 0 ? () => move('prompts', p.id, -1) : null} onDown={i < data.prompts.length - 1 ? () => move('prompts', p.id, 1) : null}
                onEdit={() => setEditing({ what: 'prompts', item: p })}
                onDelete={data.prompts.length > 1 ? () => remove('prompts', p, p.texts.en.text) : null} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function ScenarioEditor({ item, onDone }) {
  const t = useT()
  const { busy, error, run } = useRun()
  const [texts, set] = useTexts(['name', 'prompt'], item?.texts)
  const save = async () => {
    if ((await run(() => (item ? admin.save('scenarios', item.id, { texts }) : admin.add('scenarios', { texts })))).ok) onDone(true)
  }
  return (
    <Editor title={item ? t(['Edit a situation', 'دەستکاریی دۆخێک']) : t(['A new Rehearse situation', 'دۆخێکی نوێی ڕاهێنان'])} onSave={save} onCancel={() => onDone(false)} busy={busy} error={error}>
      <BiField label={['Name', 'ناو']} field="name" texts={texts} set={set} max={80} hint={['e.g. Job interview', 'بۆ نموونە چاوپێکەوتنی کار']} />
      <BiField label={['What to say to the camera', 'چی بە کامێراکە بڵێیت']} field="prompt" texts={texts} set={set} area max={400} />
    </Editor>
  )
}

function PromptEditor({ item, onDone }) {
  const t = useT()
  const { busy, error, run } = useRun()
  const [texts, set] = useTexts(['text'], item?.texts)
  const save = async () => {
    if ((await run(() => (item ? admin.save('prompts', item.id, { texts }) : admin.add('prompts', { texts })))).ok) onDone(true)
  }
  return (
    <Editor title={item ? t(['Edit a Poker face line', 'دەستکاریی ڕستەیەکی دەموچاوی پۆکەر']) : t(['A new Poker face line', 'ڕستەیەکی نوێی دەموچاوی پۆکەر'])} onSave={save} onCancel={() => onDone(false)} busy={busy} error={error}>
      <BiField label={['The line', 'ڕستەکە']} field="text" texts={texts} set={set} area max={300} hint={['Something that tries to make the face react.', 'شتێک کە هەوڵ دەدات دەموچاو کاردانەوەی هەبێت.']} />
    </Editor>
  )
}

