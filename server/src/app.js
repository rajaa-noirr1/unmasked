// Unmasked API on the laptop: Express in front of PostgreSQL 17, plain SQL.
//   GET  /api/health                     is the database there, and how much is in it
//   GET  /api/content                    everything the pages show, in both languages
//   POST /api/rehearsals                 save a Rehearse report; returns it next to the previous one
//   GET  /api/rehearsals?visitor=…       a visitor's rehearsals, newest first
//   POST /api/attempts                   start a test
//   POST /api/attempts/:id/answers       answer one question; returns whether it was right and how others answered
//   GET  /api/attempts/:id               an attempt's score
//   GET  /api/stats/questions?test=…     how everyone did on each question
//   GET  /api/photos/7.jpg               a photo uploaded from the admin page (kept in the database)
//   /api/admin/…                         the admin side: sign in, then change the content (admin.js)
// Visitors have no accounts: the browser sends a random id it keeps (a UUID). No names, no pictures.
import express from 'express'
import { q, rows, one, tx } from './db.js'
import { cachedContent, clearContent } from './content.js'
import { BadRequest, int, route } from './http.js'
import { admin } from './admin.js'

export const app = express()
app.use(express.json({ limit: '50kb' }))

// ── small helpers ──
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const visitorId = (v) => { if (typeof v !== 'string' || !UUID.test(v)) throw new BadRequest('visitor must be a UUID'); return v.toLowerCase() }
const lang = (v) => (v === 'ckb' ? 'ckb' : 'en')

// Every write first makes sure the visitor exists (and was seen now).
const VISIT = `INSERT INTO visitors (id, lang) VALUES ($1, $2)
               ON CONFLICT (id) DO UPDATE SET last_seen = now(), lang = EXCLUDED.lang`

// ── content ──
app.get('/api/health', route(async (_req, res) => {
  res.json({ ok: true, database: (await one('SELECT current_database() AS name')).name, counts: await one('SELECT * FROM content_counts') })
}))

app.get('/api/content', route(async (_req, res) => {
  // read once and kept; an admin's change clears it. After npm run db:reset, restart the API or POST /api/content/refresh
  res.json({ source: 'database', langs: await cachedContent() })
}))
app.post('/api/content/refresh', route(async (_req, res) => { clearContent(); res.json({ ok: true }) }))

// A photo uploaded from the admin page for a new question. It never changes, so browsers may keep it.
app.get('/api/photos/:file', route(async (req, res) => {
  const m = /^(\d{1,9})\.(jpg|png|webp)$/.exec(req.params.file)
  const photo = m && await one('SELECT mime, bytes FROM admin.photos WHERE id = $1', [Number(m[1])])
  if (!photo) return res.status(404).json({ error: 'no such photo' })
  res.set('Cache-Control', 'public, max-age=31536000, immutable').type(photo.mime).send(photo.bytes)
}))

// ── the admin side ──
app.use('/api/admin', admin)

// ── rehearsals ──
const REHEARSAL_COLS = `id, scenario, recorded_at, seconds, face_share, blinks_per_min, smiles, smiles_eyes, presses,
  brow_up, brow_down, still, tilt, attempt_number, prev_blinks_per_min, prev_smiles, prev_smiles_eyes, prev_presses,
  prev_brow_up, prev_still, prev_tilt`

app.post('/api/rehearsals', route(async (req, res) => {
  const b = req.body || {}
  const visitor = visitorId(b.visitor)
  const r = {
    seconds: Number(b.seconds), face_share: int(b.faceShare, 'faceShare', 0, 100), blinks_per_min: int(b.blinksPerMin, 'blinksPerMin', 0, 400),
    smiles: int(b.smiles, 'smiles', 0, 1000), smiles_eyes: int(b.smilesEyes, 'smilesEyes', 0, 1000), presses: int(b.presses, 'presses', 0, 1000),
    brow_up: int(b.browUp, 'browUp', 0, 100), brow_down: int(b.browDown, 'browDown', 0, 100), still: int(b.still, 'still', 0, 100), tilt: int(b.tilt, 'tilt', 0, 100),
  }
  if (!(r.seconds > 0 && r.seconds <= 120)) throw new BadRequest('seconds must be between 0 and 120')
  const saved = await tx(async (c) => {
    await c.query(VISIT, [visitor, lang(b.lang)])
    const scenario = (await c.query('SELECT id FROM scenarios WHERE slug = $1', [b.scenario])).rows[0]
    if (!scenario) throw new BadRequest('unknown scenario')
    const cols = Object.keys(r)
    const { id } = (await c.query(
      `INSERT INTO rehearsals (visitor_id, scenario_id, ${cols.join(', ')})
       VALUES ($1, $2, ${cols.map((_, i) => `$${i + 3}`).join(', ')}) RETURNING id`,
      [visitor, scenario.id, ...cols.map((k) => r[k])])).rows[0]
    return (await c.query(`SELECT ${REHEARSAL_COLS} FROM rehearsal_progress WHERE id = $1`, [id])).rows[0]
  })
  res.status(201).json(saved)
}))

app.get('/api/rehearsals', route(async (req, res) => {
  const visitor = visitorId(req.query.visitor)
  res.json(await rows(`SELECT ${REHEARSAL_COLS} FROM rehearsal_progress WHERE visitor_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 50`, [visitor]))
}))

// ── tests ──
app.post('/api/attempts', route(async (req, res) => {
  const b = req.body || {}
  const visitor = visitorId(b.visitor)
  const attempt = await tx(async (c) => {
    await c.query(VISIT, [visitor, lang(b.lang)])
    const test = (await c.query('SELECT id FROM tests WHERE slug = $1', [b.test])).rows[0]
    if (!test) throw new BadRequest('unknown test')
    return (await c.query('INSERT INTO test_attempts (visitor_id, test_id, lang) VALUES ($1, $2, $3) RETURNING id', [visitor, test.id, lang(b.lang)])).rows[0]
  })
  res.status(201).json(attempt)
}))

app.post('/api/attempts/:id/answers', route(async (req, res) => {
  const attemptId = int(req.params.id, 'attempt', 1, Number.MAX_SAFE_INTEGER)
  const b = req.body || {}
  const position = int(b.option, 'option', 1, 6)
  // Find the question and option by the slug and position the page knows; the trigger checks they fit.
  const target = await one(
    `SELECT q.id AS question_id, o.id AS option_id, o.is_correct
       FROM test_attempts a
       JOIN questions q ON q.test_id = a.test_id AND q.slug = $2
       JOIN options o ON o.question_id = q.id AND o.position = $3
      WHERE a.id = $1`, [attemptId, b.question, position])
  if (!target) throw new BadRequest('unknown attempt, question or option')
  await q(`INSERT INTO attempt_answers (attempt_id, question_id, option_id) VALUES ($1, $2, $3)
           ON CONFLICT (attempt_id, question_id) DO UPDATE SET option_id = EXCLUDED.option_id, answered_at = now()`,
    [attemptId, target.question_id, target.option_id])
  const picks = await rows('SELECT position, picks, percent, is_correct FROM option_picks WHERE question_id = $1 ORDER BY position', [target.question_id])
  const score = await one('SELECT answered, correct, total, finished_at FROM attempt_scores WHERE attempt_id = $1', [attemptId])
  res.json({ correct: target.is_correct, picks, score })
}))

app.get('/api/attempts/:id', route(async (req, res) => {
  const score = await one('SELECT * FROM attempt_scores WHERE attempt_id = $1', [int(req.params.id, 'attempt', 1, Number.MAX_SAFE_INTEGER)])
  if (!score) return res.status(404).json({ error: 'no such attempt' })
  res.json(score)
}))

app.get('/api/stats/questions', route(async (req, res) => {
  res.json(await rows('SELECT * FROM question_stats WHERE ($1::text IS NULL OR test = $1) ORDER BY question_id', [req.query.test || null]))
}))

// ── errors ──
app.use('/api', (_req, res) => res.status(404).json({ error: 'no such address' }))
app.use((err, _req, res, _next) => {
  // 23514: a CHECK or a trigger refused it; 23503: it points at something that does not exist;
  // 23505: something with that id or position is already there
  if (err.code === '23514' || err.code === '23503' || err.code === '23505' || err.code === '22P02') {
    return res.status(400).json({ error: err.message })
  }
  // our own refusals (400, 404) and the body parser's (a body too large, JSON that does not parse)
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.expose === false ? 'bad request' : err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})
