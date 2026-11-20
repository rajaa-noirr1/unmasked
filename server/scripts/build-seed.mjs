// Builds db/seed.sql from the website's content files (client/src/data and the Kurdish overlays in
// client/src/i18n/ckb), merged exactly the way the site merges them, so the database holds what the
// site shows. Run after changing any content: npm run db:seed:build (then npm run db:reset).
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSiteContent } from './site-content.mjs'

const here = dirname(fileURLToPath(import.meta.url))

// 1. Load the content
const { dataFor, REHEARSE } = await loadSiteContent()
const LANGS = ['en', 'ckb']
const C = { en: dataFor('en'), ckb: dataFor('ckb') }

// 2. SQL helpers
const lit = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return `${lit(JSON.stringify(v))}::jsonb`
  return `'${String(v).replace(/'/g, "''")}'`
}
const sql = []
const insert = (table, cols, rows) => {
  if (!rows.length) return
  sql.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${rows.map((r) => `  (${r.map(lit).join(', ')})`).join(',\n')};\n`)
}
const must = (cond, msg) => { if (!cond) throw new Error(msg) }

// 3. Languages and evidence
insert('languages', ['code', 'name', 'native_name', 'direction', 'position'], [['en', 'English', 'English', 'ltr', 1], ['ckb', 'Kurdish (Sorani)', 'کوردی', 'rtl', 2]])
const LEVELS = [['solid', 3], ['mixed', 2], ['weak', 1]]
insert('evidence_levels', ['code', 'rank'], LEVELS)
insert('evidence_level_texts', ['level_code', 'lang', 'label'], LEVELS.flatMap(([code]) => LANGS.map((l) => [code, l, C[l].STRENGTH[code]])))

// 4. The Map
const partSlugs = Object.keys(C.en.REGION_INFO)
const partId = Object.fromEntries(partSlugs.map((s, i) => [s, i + 1]))
const parentOf = {}
for (const [slug, info] of Object.entries(C.en.REGION_INFO)) for (const child of info.parts || []) parentOf[child] = slug
insert('body_parts', ['id', 'slug', 'parent_id', 'position'], partSlugs.map((s, i) => [i + 1, s, parentOf[s] ? partId[parentOf[s]] : null, i + 1]))
insert('body_part_texts', ['body_part_id', 'lang', 'name', 'short_name', 'line', 'feels'],
  partSlugs.flatMap((s) => LANGS.map((l) => { const r = C[l].REGION_INFO[s]; return [partId[s], l, r.name, r.short, r.line, r.feels] })))
const signals = [], signalTexts = []
let signalId = 0
for (const s of partSlugs) {
  C.en.REGION_INFO[s].says.forEach((sig, i) => {
    signalId++
    signals.push([signalId, partId[s], i + 1, sig.strength])
    for (const l of LANGS) { const x = C[l].REGION_INFO[s].says[i]; signalTexts.push([signalId, l, x.tell, x.means, x.context]) }
  })
}
insert('signals', ['id', 'body_part_id', 'position', 'evidence'], signals)
insert('signal_texts', ['signal_id', 'lang', 'tell', 'means', 'context'], signalTexts)
insert('feelings', ['id', 'slug', 'position'], C.en.BODY_MAPS.map((m, i) => [i + 1, m.id, i + 1]))
insert('feeling_texts', ['feeling_id', 'lang', 'name', 'note'], C.en.BODY_MAPS.flatMap((m, i) => LANGS.map((l) => [i + 1, l, C[l].BODY_MAPS[i].name, C[l].BODY_MAPS[i].note])))
insert('feeling_heat', ['feeling_id', 'body_part_id', 'heat'], C.en.BODY_MAPS.flatMap((m, i) => Object.entries(m.heat).map(([part, heat]) => {
  must(partId[part], `heat for unknown body part ${part}`)
  return [i + 1, partId[part], heat]
})))

// 5. The Mirror
insert('action_units', ['au', 'muscle', 'zone', 'position'], C.en.UNITS.map((u, i) => [u.au, u.muscle, u.zone, i + 1]))
insert('action_unit_texts', ['au', 'lang', 'name', 'plain'], C.en.UNITS.flatMap((u, i) => LANGS.map((l) => [u.au, l, C[l].UNITS[i].name, C[l].UNITS[i].plain])))
insert('expressions', ['id', 'slug', 'position'], C.en.TARGETS.map((t, i) => [i + 1, t.id, i + 1]))
insert('expression_texts', ['expression_id', 'lang', 'name', 'hint'], C.en.TARGETS.flatMap((t, i) => LANGS.map((l) => [i + 1, l, C[l].TARGETS[i].name, C[l].TARGETS[i].hint])))
insert('expression_units', ['expression_id', 'au', 'role', 'level'], C.en.TARGETS.flatMap((t, i) => [
  ...Object.entries(t.need).map(([au, level]) => [i + 1, Number(au), 'need', level]),
  ...t.avoid.map((au) => [i + 1, au, 'avoid', null]),
]))
must(C.en.PROMPTS.length === C.ckb.PROMPTS.length, 'English and Kurdish poker prompts differ in number')
insert('poker_prompts', ['id', 'position'], C.en.PROMPTS.map((_, i) => [i + 1, i + 1]))
insert('poker_prompt_texts', ['prompt_id', 'lang', 'text'], C.en.PROMPTS.flatMap((_, i) => LANGS.map((l) => [i + 1, l, C[l].PROMPTS[i]])))
insert('scenarios', ['id', 'slug', 'position'], REHEARSE.SCENARIOS.map((s, i) => [i + 1, s.id, i + 1]))
insert('scenario_texts', ['scenario_id', 'lang', 'name', 'prompt'], REHEARSE.SCENARIOS.flatMap((s, i) => LANGS.map((l, k) => [i + 1, l, s.name[k], s.prompt[k]])))
const measures = Object.entries(REHEARSE.METRICS)
insert('report_measures', ['slug', 'evidence', 'position'], measures.map(([slug, m], i) => [slug, m.strength, i + 1]))
insert('report_measure_texts', ['measure', 'lang', 'title', 'reading'], measures.flatMap(([slug, m]) => LANGS.map((l, k) => [slug, l, m.title[k], m.read[k]])))

// 6. The tests
insert('tests', ['id', 'slug', 'kind', 'position'], C.en.TESTS.map((t, i) => [i + 1, t.id, t.kind, i + 1]))
insert('test_texts', ['test_id', 'lang', 'name', 'kicker', 'blurb'], C.en.TESTS.flatMap((t, i) => LANGS.map((l) => [i + 1, l, C[l].TESTS[i].name, C[l].TESTS[i].kicker, C[l].TESTS[i].blurb])))
const questions = [], questionTexts = [], options = [], optionTexts = []
let qid = 0, oid = 0
C.en.TESTS.forEach((t, ti) => {
  t.items.forEach((it, qi) => {
    qid++
    const img = it.image || it.photo
    must(img && img.file, `question ${it.id} has no photo`)
    const frame = img.crop ? { crop: img.crop } : img.veil ? { veil: img.veil } : null
    questions.push([qid, ti + 1, it.id, qi + 1, img.file.replace(/\.jpg$/, ''), img.who || '', frame, it.pose || null, it.scene || null])
    for (const l of LANGS) {
      const x = C[l].TESTS[ti].items[qi]
      const xi = x.image || x.photo
      questionTexts.push([qid, l, x.prompt, x.title, x.cue, x.why, x.place || null, xi.credit || ''])
    }
    must(it.answerIndex >= 0, `question ${it.id} has no right answer`)
    it.options.forEach((_, k) => {
      oid++
      options.push([oid, qid, k + 1, k === it.answerIndex])
      for (const l of LANGS) optionTexts.push([oid, l, C[l].TESTS[ti].items[qi].options[k]])
    })
  })
})
insert('questions', ['id', 'test_id', 'slug', 'position', 'photo_file', 'photo_who', 'photo_frame', 'pose', 'scene'], questions)
insert('question_texts', ['question_id', 'lang', 'prompt', 'title', 'cue', 'why', 'place', 'credit'], questionTexts)
insert('options', ['id', 'question_id', 'position', 'is_correct'], options)
insert('option_texts', ['option_id', 'lang', 'label'], optionTexts)

// 7. Checks that a constraint cannot express on its own
sql.push(`DO $check$
BEGIN
  IF EXISTS (SELECT 1 FROM questions q WHERE NOT EXISTS (SELECT 1 FROM options o WHERE o.question_id = q.id AND o.is_correct)) THEN
    RAISE EXCEPTION 'every question needs exactly one right answer';
  END IF;
  IF EXISTS (SELECT 1 FROM languages l CROSS JOIN questions q WHERE NOT EXISTS (SELECT 1 FROM question_texts t WHERE t.question_id = q.id AND t.lang = l.code)) THEN
    RAISE EXCEPTION 'a question is missing a language';
  END IF;
END
$check$;\n`)

const header = `-- Unmasked: the content, in English and Kurdish Sorani. GENERATED by scripts/build-seed.mjs from the
-- website's content files: edit those, then run npm run db:seed:build. Do not edit by hand.
-- ${partSlugs.length} body parts, ${signals.length} signals, ${C.en.BODY_MAPS.length} feelings, ${C.en.UNITS.length} action units, ${C.en.TARGETS.length} expressions,
-- ${C.en.PROMPTS.length} poker prompts, ${REHEARSE.SCENARIOS.length} scenarios, ${measures.length} report measures, ${C.en.TESTS.length} tests, ${questions.length} questions, ${options.length} options.\n\n`
writeFileSync(join(here, '..', 'db', 'seed.sql'), header + sql.join('\n'))
console.log(`wrote db/seed.sql: ${signals.length} signals, ${questions.length} questions, ${options.length} options`)
