// End-to-end tests of the admin side on the real database. Run: npm test (after npm run db:reset).
// They add a throwaway admin, sign in, add, change, reorder and delete content through the API, check the
// website's content follows each change, and remove everything they added at the end.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'
import { hashPassword } from '../src/auth.js'

let base, server, cookie = ''
const username = `test-${randomBytes(4).toString('hex')}`
const password = randomBytes(18).toString('base64url')
const visitors = []
const photos = []

async function call(method, path, body, headers = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const set = res.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0]
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers }
}
const content = async () => (await call('GET', '/content')).body.langs

before(async () => {
  server = app.listen(0)
  base = `http://localhost:${server.address().port}/api`
  await pool.query('INSERT INTO admin.accounts (username, password_hash) VALUES ($1, $2)', [username, await hashPassword(password)])
})
after(async () => {
  if (visitors.length) await pool.query('DELETE FROM visitors WHERE id = ANY($1::uuid[])', [visitors])
  if (photos.length) await pool.query('DELETE FROM admin.photos WHERE id = ANY($1)', [photos])
  await pool.query('DELETE FROM admin.changes WHERE account_id = (SELECT id FROM admin.accounts WHERE username = $1)', [username])
  await pool.query('DELETE FROM admin.accounts WHERE username = $1', [username])
  server.close()
  await pool.end()
})

test('without signing in, the admin side is closed', async () => {
  assert.equal((await call('GET', '/admin/tests')).status, 401)
  assert.equal((await call('POST', '/admin/scenarios', { texts: { en: { name: 'x', prompt: 'y' } } })).status, 401)
  assert.equal((await call('GET', '/admin/me')).status, 401)
})

test('a wrong password is refused, the right one signs in with an HttpOnly cookie', async () => {
  const wrong = await call('POST', '/admin/login', { username, password: 'not-the-password' })
  assert.equal(wrong.status, 401)
  assert.equal(cookie, '')
  const ok = await call('POST', '/admin/login', { username: username.toUpperCase(), password })
  assert.equal(ok.status, 200)
  assert.match(ok.headers.get('set-cookie'), /HttpOnly/)
  assert.match(ok.headers.get('set-cookie'), /SameSite=Strict/)
  assert.ok(cookie.startsWith('unmasked_admin='))
  assert.equal((await call('GET', '/admin/me')).body.username, username)
  // only a hash of the token is stored
  const { rows } = await pool.query('SELECT token_hash FROM admin.sessions s JOIN admin.accounts a ON a.id = s.account_id WHERE a.username = $1', [username])
  assert.equal(rows.length, 1)
  assert.notEqual(rows[0].token_hash.toString('base64url'), cookie.split('=')[1])
})

test('a write from another site is refused; one from the site on another port is not', async () => {
  const r = await call('POST', '/admin/prompts', { texts: { en: { text: 'x' } } }, { Origin: 'http://elsewhere.example' })
  assert.equal(r.status, 403)
  // the site on 5180 talks to the API on another port (through the dev server): same machine, so it passes
  // the check and reaches the validation (an empty line is refused there, so nothing is added)
  const local = await call('POST', '/admin/prompts', { texts: { en: { text: '' } } }, { Origin: 'http://127.0.0.1:5180' })
  assert.equal(local.status, 400)
})

test('a new question: added, shown in both languages, answered, changed, moved and deleted', async () => {
  const before = (await content()).en.TESTS.find((t) => t.id === 'context').items.length
  const added = await call('POST', '/admin/questions', {
    test: 'context', pose: 'shrug', scene: 'room',
    texts: { en: { prompt: 'Why the shrug?', title: 'Not knowing', cue: 'Palms up, shoulders raised.', why: 'A shrug in a quiz is not a shrug in a fight.', place: 'A quiz night' } },
    options: [{ en: 'Bored' }, { en: 'Not knowing', ckb: 'نەزانین' }, { en: 'Angry' }],
    answer: 1,
  })
  assert.equal(added.status, 201)
  assert.equal(added.body.slug, 'c-not-knowing')
  let langs = await content()
  let en = langs.en.TESTS.find((t) => t.id === 'context').items
  assert.equal(en.length, before + 1)
  const item = en.at(-1)
  assert.deepEqual([item.id, item.answer, item.answerIndex, item.pose, item.scene], ['c-not-knowing', 'Not knowing', 1, 'shrug', 'room'])
  assert.equal(item.photo.src, 'images/context/c-not-knowing')
  // Kurdish left empty takes the English; Kurdish given is used
  const ckb = langs.ckb.TESTS.find((t) => t.id === 'context').items.at(-1)
  assert.deepEqual(ckb.options, ['Bored', 'نەزانین', 'Angry'])
  assert.equal(ckb.prompt, 'Why the shrug?')

  // a visitor answers it with the old option 3, which is about to disappear
  const visitor = randomUUID(); visitors.push(visitor)
  const { body: attempt } = await call('POST', '/attempts', { visitor, test: 'context', lang: 'en' })
  assert.equal((await call('POST', `/attempts/${attempt.id}/answers`, { question: 'c-not-knowing', option: 3 })).body.correct, false)

  // changed: Kurdish added, two options left, the right one is now the first
  const edited = await call('PUT', `/admin/questions/${added.body.id}`, {
    pose: 'shrug', scene: 'room',
    texts: { en: { prompt: 'Why the shrug?', title: 'Not knowing', cue: 'Palms up.', why: 'Context.', place: 'A quiz night' },
             ckb: { prompt: 'بۆچی شان هەڵتەکاندن؟', title: 'نەزانین', cue: 'لەپی دەست بەرەو سەرەوە.', why: 'دەوروبەر.', place: 'شەوی پرسیار' } },
    options: [{ en: 'Not knowing', ckb: 'نەزانین' }, { en: 'Bored', ckb: 'بێزاری' }],
    answer: 0,
  })
  assert.equal(edited.status, 200)
  langs = await content()
  const ck = langs.ckb.TESTS.find((t) => t.id === 'context').items.find((i) => i.id === 'c-not-knowing')
  assert.deepEqual([ck.prompt, ck.answer, ck.answerIndex, ck.options.length], ['بۆچی شان هەڵتەکاندن؟', 'نەزانین', 0, 2])
  // the answer that chose the removed option went with it
  const { rows: left } = await pool.query('SELECT count(*)::int AS n FROM attempt_answers WHERE attempt_id = $1', [attempt.id])
  assert.equal(left[0].n, 0)

  // the full question comes back for the edit form
  const full = await call('GET', `/admin/questions/${added.body.id}`)
  assert.equal(full.body.texts.ckb.title, 'نەزانین')
  assert.deepEqual(full.body.options.map((o) => o.correct), [true, false])

  // moved up one place
  assert.equal((await call('POST', `/admin/questions/${added.body.id}/move`, { by: -1 })).body.moved, true)
  en = (await content()).en.TESTS.find((t) => t.id === 'context').items
  assert.equal(en.at(-2).id, 'c-not-knowing')

  // nonsense is refused, with a reason
  const bad = await call('POST', '/admin/questions', { test: 'context', texts: { en: { prompt: 'x', title: 'y', cue: 'z', why: 'w' } }, options: [{ en: 'Only one' }], answer: 0 })
  assert.equal(bad.status, 400)
  assert.match(bad.body.error, /2 to 6 options/)

  assert.equal((await call('DELETE', `/admin/questions/${added.body.id}`)).status, 200)
  en = (await content()).en.TESTS.find((t) => t.id === 'context').items
  assert.equal(en.length, before)
  assert.ok(!en.some((i) => i.id === 'c-not-knowing'))
})

test('the Map: a signal is added to the shoulders, changed and deleted', async () => {
  const shoulders = (await call('GET', '/admin/map')).body.parts.find((p) => p.slug === 'shoulders')
  const n = shoulders.signals.length
  const added = await call('POST', '/admin/signals', { part: shoulders.id, evidence: 'mixed', texts: { en: { tell: 'One shoulder up', means: 'Doubt', context: 'Or a stiff neck.' } } })
  assert.equal(added.status, 201)
  let says = (await content()).ckb.REGION_INFO.shoulders.says
  assert.equal(says.length, n + 1)
  assert.deepEqual(says.at(-1), { tell: 'One shoulder up', means: 'Doubt', context: 'Or a stiff neck.', strength: 'mixed' })
  assert.equal((await call('POST', '/admin/signals', { part: shoulders.id, evidence: 'certain', texts: { en: { tell: 'a', means: 'b', context: 'c' } } })).status, 400)
  await call('PUT', `/admin/signals/${added.body.id}`, { evidence: 'weak', texts: { en: { tell: 'One shoulder up', means: 'Doubt', context: 'Or a stiff neck.' }, ckb: { tell: 'شانێک بەرز', means: 'گومان', context: 'یان ملی ڕەق.' } } })
  says = (await content()).ckb.REGION_INFO.shoulders.says
  assert.deepEqual([says.at(-1).tell, says.at(-1).strength], ['شانێک بەرز', 'weak'])
  await call('DELETE', `/admin/signals/${added.body.id}`)
  assert.equal((await content()).en.REGION_INFO.shoulders.says.length, n)
})

test('the Mirror: a Rehearse situation and a Poker face line', async () => {
  const sc = await call('POST', '/admin/scenarios', { texts: { en: { name: 'Thesis defence', prompt: 'Tell the committee what you found.' } } })
  assert.equal(sc.status, 201)
  assert.equal(sc.body.slug, 'thesis-defence')
  let langs = await content()
  assert.deepEqual(langs.en.SCENARIOS.at(-1), { id: 'thesis-defence', name: 'Thesis defence', prompt: 'Tell the committee what you found.' })
  // a visitor rehearses it, then it is deleted with its rehearsals
  const visitor = randomUUID(); visitors.push(visitor)
  const saved = await call('POST', '/rehearsals', { visitor, scenario: 'thesis-defence', seconds: 30, faceShare: 90, blinksPerMin: 20, smiles: 1, smilesEyes: 1, presses: 0, browUp: 5, browDown: 0, still: 50, tilt: 3 })
  assert.equal(saved.status, 201)
  assert.equal((await call('DELETE', `/admin/scenarios/${sc.body.id}`)).status, 200)
  assert.ok(!(await content()).en.SCENARIOS.some((s) => s.id === 'thesis-defence'))

  const n = (await content()).en.PROMPTS.length
  const p = await call('POST', '/admin/prompts', { texts: { en: { text: 'Your camera is still on.' }, ckb: { text: 'کامێراکەت هێشتا داگیرساوە.' } } })
  assert.equal(p.status, 201)
  langs = await content()
  assert.equal(langs.ckb.PROMPTS.at(-1), 'کامێراکەت هێشتا داگیرساوە.')
  assert.equal((await call('POST', `/admin/prompts/${p.body.id}/move`, { by: 1 })).body.moved, false)
  await call('DELETE', `/admin/prompts/${p.body.id}`)
  assert.equal((await content()).en.PROMPTS.length, n)
})

test('a photo is uploaded into the database and served back', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const res = await fetch(`${base}/admin/photos`, { method: 'POST', headers: { 'Content-Type': 'image/png', Cookie: cookie }, body: png })
  const up = await res.json()
  assert.equal(res.status, 201)
  photos.push(up.id)
  assert.match(up.file, /^api\/photos\/\d+\.png$/)
  const back = await fetch(`${base.replace(/\/api$/, '')}/${up.file}`)
  assert.equal(back.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await back.arrayBuffer()), png)
  const fake = await fetch(`${base}/admin/photos`, { method: 'POST', headers: { 'Content-Type': 'image/png', Cookie: cookie }, body: Buffer.from('not a picture at all') })
  assert.equal(fake.status, 400)
})

test('every change is in the log, and signing out closes the admin side again', async () => {
  const { body } = await call('GET', '/admin/overview')
  assert.equal(body.counts.questions, 30)
  const mine = body.changes.filter((c) => c.username === username)
  assert.ok(mine.some((c) => c.action === 'delete' && c.kind === 'question'))
  assert.ok(mine.some((c) => c.action === 'add' && c.kind === 'photo'))
  const token = cookie
  await call('POST', '/admin/logout')
  assert.equal(cookie, '')
  cookie = token   // the old cookie no longer opens anything
  assert.equal((await call('GET', '/admin/me')).status, 401)
  cookie = ''
})
