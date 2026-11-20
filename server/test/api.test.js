// End-to-end tests of the API on the real database. Run: npm test (after npm run db:reset).
// They create visitors with random ids and delete them at the end (their rehearsals and answers go too).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'
import { loadSiteContent } from '../scripts/site-content.mjs'

let base, server
const visitors = []
const newVisitor = () => { const id = randomUUID(); visitors.push(id); return id }
const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, body: await res.json() }
}

before(async () => {
  server = app.listen(0)
  base = `http://localhost:${server.address().port}/api`
})
after(async () => {
  if (visitors.length) await pool.query('DELETE FROM visitors WHERE id = ANY($1::uuid[])', [visitors])
  server.close()
  await pool.end()
})

test('the database holds the whole site', async () => {
  const { status, body } = await call('GET', '/health')
  assert.equal(status, 200)
  const c = body.counts
  assert.deepEqual([c.body_parts, c.signals, c.feelings, c.action_units, c.expressions, c.scenarios, c.tests, c.questions, c.options],
    [13, 36, 9, 15, 8, 5, 3, 30, 120])
})

test('the content from the database is exactly what the site shows, in both languages', async () => {
  const { body } = await call('GET', '/content')
  const { dataFor, REHEARSE } = await loadSiteContent()
  // keys that are empty on one side and missing on the other mean the same thing
  const clean = (v) => JSON.parse(JSON.stringify(v, (_k, x) => (x === null ? undefined : x)))
  for (const lang of ['en', 'ckb']) {
    const db = body.langs[lang]
    const site = dataFor(lang)
    assert.deepEqual(clean(db.STRENGTH), clean(site.STRENGTH), `${lang}: evidence labels`)
    assert.deepEqual(clean(db.REGION_INFO), clean(site.REGION_INFO), `${lang}: the Map`)
    assert.deepEqual(clean(db.BODY_MAPS), clean(site.BODY_MAPS), `${lang}: feelings`)
    assert.deepEqual(clean(db.TARGETS), clean(site.TARGETS), `${lang}: expressions`)
    assert.deepEqual(db.PROMPTS, site.PROMPTS, `${lang}: poker prompts`)
    assert.deepEqual(db.UNITS, site.UNITS.map(({ au, muscle, zone, name, plain }) => ({ au, muscle, zone, name, plain })), `${lang}: muscles`)
    const withBase = (p) => p && { ...p, src: `/${p.src}` }
    const dbTests = db.TESTS.map((t) => ({ ...t, items: t.items.map((it) => ({ ...it, image: withBase(it.image), photo: withBase(it.photo) })) }))
    assert.deepEqual(clean(dbTests), clean(site.TESTS), `${lang}: tests`)
    const k = lang === 'en' ? 0 : 1
    assert.deepEqual(db.SCENARIOS, REHEARSE.SCENARIOS.map((s) => ({ id: s.id, name: s.name[k], prompt: s.prompt[k] })), `${lang}: scenarios`)
  }
})

test('a rehearsal is saved, and the next one comes back next to it', async () => {
  const visitor = newVisitor()
  const report = { visitor, scenario: 'job', lang: 'en', seconds: 45, faceShare: 98, blinksPerMin: 31, smiles: 4, smilesEyes: 1, presses: 4, browUp: 22, browDown: 9, still: 48, tilt: 12 }
  const first = await call('POST', '/rehearsals', report)
  assert.equal(first.status, 201)
  assert.equal(first.body.attempt_number, 1)
  assert.equal(first.body.prev_blinks_per_min, null)
  const second = await call('POST', '/rehearsals', { ...report, blinksPerMin: 24, smilesEyes: 3 })
  assert.equal(second.body.attempt_number, 2)
  assert.equal(second.body.prev_blinks_per_min, 31)
  assert.equal(second.body.prev_smiles_eyes, 1)
  const list = await call('GET', `/rehearsals?visitor=${visitor}`)
  assert.equal(list.body.length, 2)
})

test('the database refuses a report that cannot be true', async () => {
  const visitor = newVisitor()
  // more smiles reaching the eyes than smiles: the CHECK constraint says no
  const bad = await call('POST', '/rehearsals', { visitor, scenario: 'job', seconds: 45, faceShare: 90, blinksPerMin: 20, smiles: 1, smilesEyes: 2, presses: 0, browUp: 0, browDown: 0, still: 50, tilt: 0 })
  assert.equal(bad.status, 400)
  const unknown = await call('POST', '/rehearsals', { visitor, scenario: 'nope', seconds: 45, faceShare: 90, blinksPerMin: 20, smiles: 1, smilesEyes: 0, presses: 0, browUp: 0, browDown: 0, still: 50, tilt: 0 })
  assert.equal(unknown.status, 400)
})

test('a test attempt: answers are checked, counted, and the attempt closes itself', async () => {
  const visitor = newVisitor()
  const { body: attempt } = await call('POST', '/attempts', { visitor, test: 'context', lang: 'en' })
  const { rows: questions } = await pool.query(
    `SELECT q.slug, o.position AS right_option FROM questions q JOIN tests t ON t.id = q.test_id
     JOIN options o ON o.question_id = q.id AND o.is_correct WHERE t.slug = 'context' ORDER BY q.position`)
  // the first one wrong on purpose, the rest right
  for (const [i, qn] of questions.entries()) {
    const option = i === 0 ? (qn.right_option % 4) + 1 : qn.right_option
    const r = await call('POST', `/attempts/${attempt.id}/answers`, { question: qn.slug, option })
    assert.equal(r.status, 200)
    assert.equal(r.body.correct, i !== 0)
    assert.equal(r.body.picks.length, 4)
  }
  const { body: score } = await call('GET', `/attempts/${attempt.id}`)
  assert.equal(score.total, questions.length)
  assert.equal(score.correct, questions.length - 1)
  assert.ok(score.finished_at, 'the trigger closes the attempt after the last answer')
  // a finished attempt takes no more answers (the trigger again)
  const late = await call('POST', `/attempts/${attempt.id}/answers`, { question: questions[0].slug, option: questions[0].right_option })
  assert.equal(late.status, 400)
})

test('the trigger refuses an option that belongs to another question', async () => {
  const visitor = newVisitor()
  const { body: attempt } = await call('POST', '/attempts', { visitor, test: 'eyes', lang: 'en' })
  const { rows: [a, b] } = await pool.query(
    `SELECT q.id AS question_id, (SELECT min(id) FROM options WHERE question_id = q.id) AS option_id
     FROM questions q JOIN tests t ON t.id = q.test_id WHERE t.slug = 'eyes' ORDER BY q.position LIMIT 2`)
  await assert.rejects(
    pool.query('INSERT INTO attempt_answers (attempt_id, question_id, option_id) VALUES ($1, $2, $3)', [attempt.id, a.question_id, b.option_id]),
    /does not belong to question/)
})
