// The admin API: sign in, then add, change, reorder or delete what the website shows.
//   POST /api/admin/login · POST /api/admin/logout · GET /api/admin/me
//   GET  /api/admin/overview                     counts, activity, the hardest questions, the latest changes
//   The tests:  GET /tests · GET /questions/:id · POST /questions · PUT /questions/:id · DELETE /questions/:id
//   The Map:    GET /map · PUT /body-parts/:id · POST /signals · PUT /signals/:id · DELETE /signals/:id
//   The Mirror: GET /mirror · POST|PUT|DELETE /scenarios(/:id) · POST|PUT|DELETE /prompts(/:id)
//   Order:      POST /<questions|signals|scenarios|prompts>/:id/move  { by: -1 | 1 }
//   Photos:     POST /photos (the image itself as the body) → { file: 'api/photos/7.jpg' }
// Everything except login needs a signed-in admin. Every change runs in one transaction, is written to
// admin.changes, and clears the content cache, so the website shows it on its next load.
// English is required; a Kurdish field left empty takes the English text until someone translates it.
import express from 'express'
import { tx, rows, one } from './db.js'
import { BadRequest, NotFound, int, route } from './http.js'
import { clearContent } from './content.js'
import * as auth from './auth.js'

export const admin = express.Router()

// ── checks on every request ──
// The site's dev server passes /api on with its own Host (localhost:4100), so only the machine's name is
// compared, not the port; localhost, 127.0.0.1 and ::1 are the same machine.
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1'])
const machine = (name) => { const n = String(name || '').toLowerCase().replace(/^\[|\]$/g, ''); return LOOPBACK.has(n) ? 'loopback' : n }
const hostName = (host) => String(host || '').replace(/:\d+$/, '')

admin.use((req, res, next) => {
  // writes only from this site's own pages (the cookie is SameSite=Strict as well)
  if (req.method !== 'GET' && req.headers.origin) {
    let from = null
    try { from = new URL(req.headers.origin).hostname } catch { /* not a URL */ }
    if (!from || machine(from) !== machine(hostName(req.headers.host))) return res.status(403).json({ error: 'not from this site' })
  }
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// ── signing in ──
admin.post('/login', route(async (req, res) => {
  const ip = req.ip || 'local'
  const wait = auth.tooManyTries(ip)
  if (wait) return res.status(429).json({ error: `Too many tries. Wait ${Math.ceil(wait / 60)} minutes.` })
  const { username, password } = req.body || {}
  const account = typeof username === 'string' && typeof password === 'string' && password.length <= 200
    ? await one('SELECT id, username, password_hash FROM admin.accounts WHERE username = $1', [username.trim().toLowerCase()])
    : null
  if (!account || !(await auth.checkPassword(password, account.password_hash))) {
    auth.failedTry(ip)
    return res.status(401).json({ error: 'Wrong username or password.' })
  }
  auth.goodTry(ip)
  auth.setCookie(res, req, await auth.startSession(account.id))
  res.json({ username: account.username })
}))

admin.post('/logout', route(async (req, res) => {
  const token = auth.readCookie(req)
  if (token) await auth.endSession(token)
  auth.setCookie(res, req, null)
  res.json({ ok: true })
}))

admin.get('/me', route(async (req, res) => {
  const who = await auth.currentAdmin(req)
  if (!who) return res.status(401).json({ error: 'not signed in' })
  res.json({ username: who.username })
}))

// from here on, signed-in admins only
admin.use(route(async (req, res, next) => {
  const who = await auth.currentAdmin(req)
  if (!who) return res.status(401).json({ error: 'Please sign in again.' })
  req.admin = who
  next()
}))

// ── helpers ──
const LANGS = ['en', 'ckb']

function str(v, name, max, required = true) {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
  if (required && !s) throw new BadRequest(`${name} is needed`)
  if (s.length > max) throw new BadRequest(`${name} is too long (at most ${max} characters)`)
  return s
}

// { en: {...}, ckb: {...} } with each field checked; empty Kurdish falls back to the English
function bilingual(texts, fields) {
  const out = { en: {}, ckb: {} }
  for (const [field, { max, optional, label = field }] of Object.entries(fields)) {
    const en = str(texts?.en?.[field], `English ${label}`, max, !optional)
    const ckb = str(texts?.ckb?.[field], `Kurdish ${label}`, max, false)
    out.en[field] = en
    out.ckb[field] = ckb || en
  }
  return out
}

const slugify = (s, digits) => s.toLowerCase().normalize('NFKD').replace(digits ? /[^a-z0-9]+/g : /[^a-z]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '')

// a slug nobody in `taken` has yet: smile, smile-2 (or smile-b where digits are not allowed)
function freeSlug(wanted, fallback, taken, digits) {
  const base = slugify(wanted || '', digits) || slugify(fallback || '', digits) || 'item'
  for (let i = 1; i < 500; i++) {
    const s = i === 1 ? base : `${base}-${digits ? i : String.fromCharCode(96 + Math.min(i, 26)).repeat(Math.ceil(i / 26))}`
    if (!taken.includes(s)) return s
  }
  throw new BadRequest('could not find a free id')
}

const nextId = async (c, table) => (await c.query(`SELECT coalesce(max(id), 0) + 1 AS id FROM ${table}`)).rows[0].id
const log = (c, req, action, kind, target) =>
  c.query('INSERT INTO admin.changes (account_id, action, kind, target) VALUES ($1, $2, $3, $4)', [req.admin.id, action, kind, target])

// one change: a transaction, a line in the log, and a fresh content cache
async function change(fn) {
  const result = await tx(fn)
  clearContent()
  return result
}

// swap a row with its neighbour above (by -1) or below (by 1), within its group
async function moveRow(c, table, id, by, group) {
  const r = (await c.query(`SELECT id, position${group ? `, ${group} AS g` : ''} FROM ${table} WHERE id = $1`, [id])).rows[0]
  if (!r) throw new NotFound()
  const nb = (await c.query(
    `SELECT id, position FROM ${table} WHERE ${group ? `${group} = $2 AND ` : ''}position ${by < 0 ? '<' : '>'} $1
     ORDER BY position ${by < 0 ? 'DESC' : 'ASC'} LIMIT 1`, group ? [r.position, r.g] : [r.position])).rows[0]
  if (!nb) return false
  // positions are UNIQUE, so the row steps aside to a negative number first
  await c.query(`UPDATE ${table} SET position = -position - 1 WHERE id = $1`, [r.id])
  await c.query(`UPDATE ${table} SET position = $2 WHERE id = $1`, [nb.id, r.position])
  await c.query(`UPDATE ${table} SET position = $2 WHERE id = $1`, [r.id, nb.position])
  return true
}

const moveBy = (b) => { const by = Number(b?.by); if (by !== -1 && by !== 1) throw new BadRequest('by must be -1 or 1'); return by }
const idParam = (req) => int(req.params.id, 'id', 1, 2147483647)

// ── overview ──
admin.get('/overview', route(async (_req, res) => {
  const [counts, activity, hardest, changes] = await Promise.all([
    one('SELECT * FROM content_counts'),
    one(`SELECT (SELECT count(*) FROM visitors WHERE last_seen > now() - interval '7 days') AS visitors_week,
                (SELECT count(*) FROM test_attempts WHERE finished_at IS NOT NULL) AS tests_finished,
                (SELECT count(*) FROM attempt_answers) AS answers,
                (SELECT count(*) FROM rehearsals) AS rehearsals,
                (SELECT count(*) FROM admin.photos) AS photos`),
    rows(`SELECT s.question_id AS id, s.test, s.question, qt.title, s.answers, s.percent_correct
            FROM question_stats s JOIN question_texts qt ON qt.question_id = s.question_id AND qt.lang = 'en'
           WHERE s.answers > 0 ORDER BY s.percent_correct, s.answers DESC LIMIT 5`),
    rows(`SELECT c.at, c.action, c.kind, c.target, a.username
            FROM admin.changes c LEFT JOIN admin.accounts a ON a.id = c.account_id ORDER BY c.at DESC, c.id DESC LIMIT 15`),
  ])
  res.json({ counts, activity, hardest, changes })
}))

// ── the tests ──
const QUESTION_FIELDS = {
  prompt: { max: 300, label: 'question' },
  title: { max: 160, label: 'answer’s title' },
  cue: { max: 800, label: 'cue' },
  why: { max: 1200, label: 'explanation' },
  place: { max: 200, optional: true, label: 'place' },
  credit: { max: 300, optional: true, label: 'credit' },
}

admin.get('/tests', route(async (_req, res) => {
  res.json(await rows(`
    SELECT t.id, t.slug, t.kind,
           (SELECT json_object_agg(lang, name) FROM test_texts WHERE test_id = t.id) AS name,
           (SELECT coalesce(json_agg(json_build_object('id', q.id, 'slug', q.slug, 'position', q.position, 'title', qt.title,
                     'prompt', qt.prompt, 'photo', q.photo_file, 'answers', s.answers, 'percent', s.percent_correct) ORDER BY q.position), '[]')
              FROM questions q JOIN question_texts qt ON qt.question_id = q.id AND qt.lang = 'en'
              JOIN question_stats s ON s.question_id = q.id
             WHERE q.test_id = t.id) AS questions
    FROM tests t ORDER BY t.position`))
}))

admin.get('/questions/:id', route(async (req, res) => {
  const qn = await one(`
    SELECT q.id, q.slug, q.position, t.slug AS test, t.kind, q.photo_file, q.photo_who, q.photo_frame, q.pose, q.scene,
           (SELECT json_object_agg(lang, json_build_object('prompt', prompt, 'title', title, 'cue', cue, 'why', why,
                     'place', coalesce(place, ''), 'credit', credit)) FROM question_texts WHERE question_id = q.id) AS texts,
           (SELECT json_agg(json_build_object('position', o.position, 'correct', o.is_correct,
                     'en', (SELECT label FROM option_texts WHERE option_id = o.id AND lang = 'en'),
                     'ckb', (SELECT label FROM option_texts WHERE option_id = o.id AND lang = 'ckb')) ORDER BY o.position)
              FROM options o WHERE o.question_id = q.id) AS options
    FROM questions q JOIN tests t ON t.id = q.test_id WHERE q.id = $1`, [idParam(req)])
  if (!qn) throw new NotFound('no such question')
  res.json(qn)
}))

const PHOTO_FILE = /^(images\/[a-z0-9_-]+(\/[a-z0-9_-]+)*(\.(jpg|jpeg|png|webp))?|api\/photos\/\d+\.(jpg|png|webp))$/i
const frac = (v, name, lo = 0, hi = 1) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < lo || n > hi) throw new BadRequest(`${name} must be between ${lo} and ${hi}`)
  return Math.round(n * 1000) / 1000
}

// checks a question as sent by the admin page, for a test of this kind
function readQuestion(b, kind) {
  const texts = bilingual(b.texts, QUESTION_FIELDS)
  const list = Array.isArray(b.options) ? b.options : []
  if (list.length < 2 || list.length > 6) throw new BadRequest('a question needs 2 to 6 options')
  const options = list.map((o, i) => {
    const en = str(o?.en, `English option ${i + 1}`, 160)
    return { en, ckb: str(o?.ckb, `Kurdish option ${i + 1}`, 160, false) || en }
  })
  const seen = new Set(options.map((o) => o.en.toLowerCase()))
  if (seen.size !== options.length) throw new BadRequest('two options say the same thing')
  const answer = int(b.answer, 'the right answer', 0, options.length - 1)
  const photo = b.photo || {}
  const file = str(photo.file, 'photo', 200, false)
  if (file && !PHOTO_FILE.test(file)) throw new BadRequest('the photo must be a file in images/… or an uploaded photo')
  let frame = null
  if (kind === 'eyes' && photo.crop) {
    const c = photo.crop
    frame = { crop: { x: frac(c.x, 'crop x'), y: frac(c.y, 'crop y'), w: frac(c.w, 'crop width', 0.02), h: frac(c.h, 'crop height', 0.02) } }
  }
  if (kind === 'body' && photo.veil) {
    const v = photo.veil
    frame = { veil: { x: frac(v.x, 'veil x'), y: frac(v.y, 'veil y'), r: frac(v.r, 'veil size', 0.01, 0.5) } }
  }
  const pose = kind === 'context' ? str(b.pose, 'pose', 30, false) || 'neutral' : null
  const scene = kind === 'context' ? str(b.scene, 'scene', 30, false) || 'none' : null
  if (pose && !/^[a-zA-Z]+$/.test(pose)) throw new BadRequest('unknown pose')
  if (scene && !/^[a-z-]+$/.test(scene)) throw new BadRequest('unknown scene')
  if (kind !== 'context') texts.en.place = texts.ckb.place = ''
  return { texts, options, answer, file, who: str(photo.who, 'who is in the photo', 200, false), frame, pose, scene }
}

async function writeQuestionTexts(c, id, v) {
  for (const lang of LANGS) {
    const t = v.texts[lang]
    await c.query(`
      INSERT INTO question_texts (question_id, lang, prompt, title, cue, why, place, credit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (question_id, lang) DO UPDATE SET prompt = EXCLUDED.prompt, title = EXCLUDED.title, cue = EXCLUDED.cue,
        why = EXCLUDED.why, place = EXCLUDED.place, credit = EXCLUDED.credit`,
    [id, lang, t.prompt, t.title, t.cue, t.why, t.place || null, t.credit])
  }
}

// the options at positions 1..n: kept (and relabelled) where they exist, added where they do not, and
// any beyond n removed with the answers that chose them. Then exactly one is marked right.
async function writeOptions(c, questionId, v) {
  const have = (await c.query('SELECT id, position FROM options WHERE question_id = $1 ORDER BY position', [questionId])).rows
  const gone = have.filter((o) => o.position > v.options.length).map((o) => o.id)
  if (gone.length) {
    await c.query('DELETE FROM attempt_answers WHERE option_id = ANY($1)', [gone])
    await c.query('DELETE FROM options WHERE id = ANY($1)', [gone])
  }
  await c.query('UPDATE options SET is_correct = false WHERE question_id = $1', [questionId])
  for (const [i, o] of v.options.entries()) {
    let id = have.find((h) => h.position === i + 1)?.id
    if (!id) {
      id = await nextId(c, 'options')
      await c.query('INSERT INTO options (id, question_id, position) VALUES ($1, $2, $3)', [id, questionId, i + 1])
    }
    if (i === v.answer) await c.query('UPDATE options SET is_correct = true WHERE id = $1', [id])
    for (const lang of LANGS) {
      await c.query(`INSERT INTO option_texts (option_id, lang, label) VALUES ($1, $2, $3)
                     ON CONFLICT (option_id, lang) DO UPDATE SET label = EXCLUDED.label`, [id, lang, o[lang]])
    }
  }
}

admin.post('/questions', route(async (req, res) => {
  const b = req.body || {}
  const saved = await change(async (c) => {
    await c.query('LOCK TABLE questions, options IN SHARE ROW EXCLUSIVE MODE')
    const test = (await c.query('SELECT id, slug, kind FROM tests WHERE slug = $1', [b.test])).rows[0]
    if (!test) throw new BadRequest('unknown test')
    const v = readQuestion(b, test.kind)
    const taken = (await c.query('SELECT slug FROM questions WHERE test_id = $1', [test.id])).rows.map((r) => r.slug)
    const prefix = test.kind === 'context' ? 'c-' : test.kind === 'body' ? 'b-' : ''
    const slug = freeSlug(b.slug, prefix + v.texts.en.title, taken, true)
    const id = await nextId(c, 'questions')
    const position = (await c.query('SELECT coalesce(max(position), 0) + 1 AS p FROM questions WHERE test_id = $1', [test.id])).rows[0].p
    await c.query(`INSERT INTO questions (id, test_id, slug, position, photo_file, photo_who, photo_frame, pose, scene)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, test.id, slug, position, v.file || `images/${test.kind}/${slug}`, v.who, v.frame, v.pose, v.scene])
    await writeQuestionTexts(c, id, v)
    await writeOptions(c, id, v)
    await log(c, req, 'add', 'question', `${test.slug} / ${slug}`)
    return { id, slug }
  })
  res.status(201).json(saved)
}))

admin.put('/questions/:id', route(async (req, res) => {
  const id = idParam(req)
  const b = req.body || {}
  await change(async (c) => {
    const qn = (await c.query('SELECT q.slug, q.photo_file, t.slug AS test, t.kind FROM questions q JOIN tests t ON t.id = q.test_id WHERE q.id = $1', [id])).rows[0]
    if (!qn) throw new NotFound('no such question')
    const v = readQuestion(b, qn.kind)
    await c.query('UPDATE questions SET photo_file = $2, photo_who = $3, photo_frame = $4, pose = $5, scene = $6 WHERE id = $1',
      [id, v.file || qn.photo_file, v.who, v.frame, v.pose, v.scene])
    await writeQuestionTexts(c, id, v)
    await writeOptions(c, id, v)
    await log(c, req, 'edit', 'question', `${qn.test} / ${qn.slug}`)
  })
  res.json({ ok: true })
}))

admin.delete('/questions/:id', route(async (req, res) => {
  const id = idParam(req)
  await change(async (c) => {
    const qn = (await c.query(`SELECT q.slug, t.slug AS test, (SELECT count(*) FROM questions WHERE test_id = q.test_id) AS n
                               FROM questions q JOIN tests t ON t.id = q.test_id WHERE q.id = $1`, [id])).rows[0]
    if (!qn) throw new NotFound('no such question')
    if (qn.n <= 1) throw new BadRequest('a test needs at least one question')
    // the answers people gave to it go with it
    await c.query('DELETE FROM attempt_answers WHERE question_id = $1', [id])
    await c.query('DELETE FROM questions WHERE id = $1', [id])
    await log(c, req, 'delete', 'question', `${qn.test} / ${qn.slug}`)
  })
  res.json({ ok: true })
}))

// ── the Map ──
const PART_FIELDS = { name: { max: 80 }, short_name: { max: 40, label: 'short name' }, line: { max: 300, label: 'line' }, feels: { max: 800, label: 'what it feels' } }
const SIGNAL_FIELDS = { tell: { max: 200, label: 'signal' }, means: { max: 400, label: 'meaning' }, context: { max: 800, label: 'context' } }

admin.get('/map', route(async (_req, res) => {
  const [parts, evidence] = await Promise.all([
    rows(`SELECT bp.id, bp.slug, p.slug AS parent,
                 (SELECT json_object_agg(lang, json_build_object('name', name, 'short_name', short_name, 'line', line, 'feels', feels))
                    FROM body_part_texts WHERE body_part_id = bp.id) AS texts,
                 (SELECT coalesce(json_agg(json_build_object('id', s.id, 'position', s.position, 'evidence', s.evidence,
                           'texts', (SELECT json_object_agg(lang, json_build_object('tell', tell, 'means', means, 'context', context))
                                       FROM signal_texts WHERE signal_id = s.id)) ORDER BY s.position), '[]')
                    FROM signals s WHERE s.body_part_id = bp.id) AS signals
            FROM body_parts bp LEFT JOIN body_parts p ON p.id = bp.parent_id ORDER BY bp.position`),
    rows(`SELECT e.code, (SELECT json_object_agg(lang, label) FROM evidence_level_texts WHERE level_code = e.code) AS label
            FROM evidence_levels e ORDER BY e.rank DESC`),
  ])
  res.json({ parts, evidence })
}))

admin.put('/body-parts/:id', route(async (req, res) => {
  const id = idParam(req)
  const texts = bilingual(req.body?.texts, PART_FIELDS)
  await change(async (c) => {
    const part = (await c.query('SELECT slug FROM body_parts WHERE id = $1', [id])).rows[0]
    if (!part) throw new NotFound('no such part of the body')
    for (const lang of LANGS) {
      const t = texts[lang]
      await c.query(`INSERT INTO body_part_texts (body_part_id, lang, name, short_name, line, feels) VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (body_part_id, lang) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name,
                       line = EXCLUDED.line, feels = EXCLUDED.feels`, [id, lang, t.name, t.short_name, t.line, t.feels])
    }
    await log(c, req, 'edit', 'body part', part.slug)
  })
  res.json({ ok: true })
}))

async function knownEvidence(c, code) {
  if (typeof code !== 'string' || !(await c.query('SELECT 1 FROM evidence_levels WHERE code = $1', [code])).rowCount) {
    throw new BadRequest('choose how well the research supports it')
  }
}

async function writeSignalTexts(c, id, texts) {
  for (const lang of LANGS) {
    const t = texts[lang]
    await c.query(`INSERT INTO signal_texts (signal_id, lang, tell, means, context) VALUES ($1, $2, $3, $4, $5)
                   ON CONFLICT (signal_id, lang) DO UPDATE SET tell = EXCLUDED.tell, means = EXCLUDED.means, context = EXCLUDED.context`,
    [id, lang, t.tell, t.means, t.context])
  }
}

admin.post('/signals', route(async (req, res) => {
  const b = req.body || {}
  const texts = bilingual(b.texts, SIGNAL_FIELDS)
  const saved = await change(async (c) => {
    await c.query('LOCK TABLE signals IN SHARE ROW EXCLUSIVE MODE')
    const part = (await c.query('SELECT id, slug FROM body_parts WHERE id = $1', [int(b.part, 'part of the body', 1, 32767)])).rows[0]
    if (!part) throw new BadRequest('unknown part of the body')
    const id = await nextId(c, 'signals')
    const position = (await c.query('SELECT coalesce(max(position), 0) + 1 AS p FROM signals WHERE body_part_id = $1', [part.id])).rows[0].p
    await knownEvidence(c, b.evidence)
    await c.query('INSERT INTO signals (id, body_part_id, position, evidence) VALUES ($1, $2, $3, $4)', [id, part.id, position, b.evidence])
    await writeSignalTexts(c, id, texts)
    await log(c, req, 'add', 'signal', `${part.slug} / ${texts.en.tell}`)
    return { id }
  })
  res.status(201).json(saved)
}))

admin.put('/signals/:id', route(async (req, res) => {
  const id = idParam(req)
  const texts = bilingual(req.body?.texts, SIGNAL_FIELDS)
  await change(async (c) => {
    const s = (await c.query('SELECT bp.slug FROM signals s JOIN body_parts bp ON bp.id = s.body_part_id WHERE s.id = $1', [id])).rows[0]
    if (!s) throw new NotFound('no such signal')
    await knownEvidence(c, req.body?.evidence)
    await c.query('UPDATE signals SET evidence = $2 WHERE id = $1', [id, req.body?.evidence])
    await writeSignalTexts(c, id, texts)
    await log(c, req, 'edit', 'signal', `${s.slug} / ${texts.en.tell}`)
  })
  res.json({ ok: true })
}))

admin.delete('/signals/:id', route(async (req, res) => {
  const id = idParam(req)
  await change(async (c) => {
    const s = (await c.query(`SELECT bp.slug, t.tell FROM signals s JOIN body_parts bp ON bp.id = s.body_part_id
                              JOIN signal_texts t ON t.signal_id = s.id AND t.lang = 'en' WHERE s.id = $1`, [id])).rows[0]
    if (!s) throw new NotFound('no such signal')
    await c.query('DELETE FROM signals WHERE id = $1', [id])
    await log(c, req, 'delete', 'signal', `${s.slug} / ${s.tell}`)
  })
  res.json({ ok: true })
}))

// ── the Mirror ──
const SCENARIO_FIELDS = { name: { max: 80 }, prompt: { max: 400, label: 'prompt' } }
const PROMPT_FIELDS = { text: { max: 300, label: 'line' } }

admin.get('/mirror', route(async (_req, res) => {
  const [scenarios, prompts] = await Promise.all([
    rows(`SELECT s.id, s.slug, s.position,
                 (SELECT json_object_agg(lang, json_build_object('name', name, 'prompt', prompt)) FROM scenario_texts WHERE scenario_id = s.id) AS texts,
                 (SELECT count(*) FROM rehearsals WHERE scenario_id = s.id) AS rehearsals
            FROM scenarios s ORDER BY s.position`),
    rows(`SELECT p.id, p.position, (SELECT json_object_agg(lang, json_build_object('text', text)) FROM poker_prompt_texts WHERE prompt_id = p.id) AS texts
            FROM poker_prompts p ORDER BY p.position`),
  ])
  res.json({ scenarios, prompts })
}))

async function writeScenarioTexts(c, id, texts) {
  for (const lang of LANGS) {
    await c.query(`INSERT INTO scenario_texts (scenario_id, lang, name, prompt) VALUES ($1, $2, $3, $4)
                   ON CONFLICT (scenario_id, lang) DO UPDATE SET name = EXCLUDED.name, prompt = EXCLUDED.prompt`,
    [id, lang, texts[lang].name, texts[lang].prompt])
  }
}

admin.post('/scenarios', route(async (req, res) => {
  const texts = bilingual(req.body?.texts, SCENARIO_FIELDS)
  const saved = await change(async (c) => {
    await c.query('LOCK TABLE scenarios IN SHARE ROW EXCLUSIVE MODE')
    const taken = (await c.query('SELECT slug FROM scenarios')).rows.map((r) => r.slug)
    const slug = freeSlug(req.body?.slug, texts.en.name, taken, false)
    const id = await nextId(c, 'scenarios')
    const position = (await c.query('SELECT coalesce(max(position), 0) + 1 AS p FROM scenarios')).rows[0].p
    await c.query('INSERT INTO scenarios (id, slug, position) VALUES ($1, $2, $3)', [id, slug, position])
    await writeScenarioTexts(c, id, texts)
    await log(c, req, 'add', 'scenario', slug)
    return { id, slug }
  })
  res.status(201).json(saved)
}))

admin.put('/scenarios/:id', route(async (req, res) => {
  const id = idParam(req)
  const texts = bilingual(req.body?.texts, SCENARIO_FIELDS)
  await change(async (c) => {
    const s = (await c.query('SELECT slug FROM scenarios WHERE id = $1', [id])).rows[0]
    if (!s) throw new NotFound('no such situation')
    await writeScenarioTexts(c, id, texts)
    await log(c, req, 'edit', 'scenario', s.slug)
  })
  res.json({ ok: true })
}))

admin.delete('/scenarios/:id', route(async (req, res) => {
  const id = idParam(req)
  await change(async (c) => {
    const s = (await c.query('SELECT slug, (SELECT count(*) FROM scenarios) AS n FROM scenarios WHERE id = $1', [id])).rows[0]
    if (!s) throw new NotFound('no such situation')
    if (s.n <= 1) throw new BadRequest('Rehearse needs at least one situation')
    await c.query('DELETE FROM rehearsals WHERE scenario_id = $1', [id])
    await c.query('DELETE FROM scenarios WHERE id = $1', [id])
    await log(c, req, 'delete', 'scenario', s.slug)
  })
  res.json({ ok: true })
}))

async function writePromptTexts(c, id, texts) {
  for (const lang of LANGS) {
    await c.query(`INSERT INTO poker_prompt_texts (prompt_id, lang, text) VALUES ($1, $2, $3)
                   ON CONFLICT (prompt_id, lang) DO UPDATE SET text = EXCLUDED.text`, [id, lang, texts[lang].text])
  }
}

admin.post('/prompts', route(async (req, res) => {
  const texts = bilingual(req.body?.texts, PROMPT_FIELDS)
  const saved = await change(async (c) => {
    await c.query('LOCK TABLE poker_prompts IN SHARE ROW EXCLUSIVE MODE')
    const id = await nextId(c, 'poker_prompts')
    const position = (await c.query('SELECT coalesce(max(position), 0) + 1 AS p FROM poker_prompts')).rows[0].p
    await c.query('INSERT INTO poker_prompts (id, position) VALUES ($1, $2)', [id, position])
    await writePromptTexts(c, id, texts)
    await log(c, req, 'add', 'prompt', texts.en.text.slice(0, 60))
    return { id }
  })
  res.status(201).json(saved)
}))

admin.put('/prompts/:id', route(async (req, res) => {
  const id = idParam(req)
  const texts = bilingual(req.body?.texts, PROMPT_FIELDS)
  await change(async (c) => {
    if (!(await c.query('SELECT 1 FROM poker_prompts WHERE id = $1', [id])).rowCount) throw new NotFound('no such line')
    await writePromptTexts(c, id, texts)
    await log(c, req, 'edit', 'prompt', texts.en.text.slice(0, 60))
  })
  res.json({ ok: true })
}))

admin.delete('/prompts/:id', route(async (req, res) => {
  const id = idParam(req)
  await change(async (c) => {
    const p = (await c.query(`SELECT t.text, (SELECT count(*) FROM poker_prompts) AS n FROM poker_prompts p
                              JOIN poker_prompt_texts t ON t.prompt_id = p.id AND t.lang = 'en' WHERE p.id = $1`, [id])).rows[0]
    if (!p) throw new NotFound('no such line')
    if (p.n <= 1) throw new BadRequest('Poker face needs at least one line')
    await c.query('DELETE FROM poker_prompts WHERE id = $1', [id])
    await log(c, req, 'delete', 'prompt', p.text.slice(0, 60))
  })
  res.json({ ok: true })
}))

// ── order ──
const MOVABLE = {
  questions: { table: 'questions', group: 'test_id', kind: 'question' },
  signals: { table: 'signals', group: 'body_part_id', kind: 'signal' },
  scenarios: { table: 'scenarios', group: null, kind: 'scenario' },
  prompts: { table: 'poker_prompts', group: null, kind: 'prompt' },
}
admin.post('/:what/:id/move', route(async (req, res, next) => {
  const m = MOVABLE[req.params.what]
  if (!m) return next()
  const id = idParam(req)
  const by = moveBy(req.body)
  const moved = await change(async (c) => {
    const did = await moveRow(c, m.table, id, by, m.group)
    if (did) await log(c, req, 'move', m.kind, `${m.table} #${id} ${by < 0 ? 'up' : 'down'}`)
    return did
  })
  res.json({ moved })
}))

// ── photos ──
const KINDS = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
]

admin.post('/photos', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '6mb' }), route(async (req, res) => {
  const bytes = req.body
  if (!Buffer.isBuffer(bytes) || bytes.length < 12) throw new BadRequest('send a JPEG, PNG or WebP photo')
  const kind = KINDS.find((k) => k.test(bytes))
  if (!kind) throw new BadRequest('that file is not a JPEG, PNG or WebP photo')
  const saved = await change(async (c) => {
    const { id } = (await c.query('INSERT INTO admin.photos (mime, bytes, uploaded_by) VALUES ($1, $2, $3) RETURNING id', [kind.mime, bytes, req.admin.id])).rows[0]
    await log(c, req, 'add', 'photo', `${id}.${kind.ext}`)
    return { id, file: `api/photos/${id}.${kind.ext}` }
  })
  res.status(201).json(saved)
}))
