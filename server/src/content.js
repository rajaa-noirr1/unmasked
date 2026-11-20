// Everything the website shows, read from the database in both languages and shaped exactly the way the
// website's pages use it (the same shape as client/src/i18n/data.js), so the pages need no changes.
// Each query assembles its own nested JSON in SQL (json_agg / json_build_object), one query per part.
import { rows } from './db.js'

const SQL = {
  evidence: `
    SELECT t.lang, e.code, t.label
    FROM evidence_levels e JOIN evidence_level_texts t ON t.level_code = e.code
    ORDER BY e.rank DESC`,

  bodyParts: `
    SELECT t.lang, bp.slug, t.name, t.short_name, t.line, t.feels,
           (SELECT json_agg(c.slug ORDER BY c.position) FROM body_parts c WHERE c.parent_id = bp.id) AS parts,
           (SELECT coalesce(json_agg(json_build_object('tell', st.tell, 'means', st.means, 'context', st.context,
                                                       'strength', s.evidence) ORDER BY s.position), '[]')
              FROM signals s JOIN signal_texts st ON st.signal_id = s.id AND st.lang = t.lang
             WHERE s.body_part_id = bp.id) AS says
    FROM body_parts bp JOIN body_part_texts t ON t.body_part_id = bp.id
    ORDER BY t.lang, bp.position`,

  feelings: `
    SELECT t.lang, f.slug AS id, t.name, t.note,
           (SELECT coalesce(json_object_agg(bp.slug, h.heat ORDER BY bp.position), '{}')
              FROM feeling_heat h JOIN body_parts bp ON bp.id = h.body_part_id
             WHERE h.feeling_id = f.id) AS heat
    FROM feelings f JOIN feeling_texts t ON t.feeling_id = f.id
    ORDER BY t.lang, f.position`,

  units: `
    SELECT t.lang, u.au, u.muscle, u.zone, t.name, t.plain
    FROM action_units u JOIN action_unit_texts t ON t.au = u.au
    ORDER BY t.lang, u.position`,

  expressions: `
    SELECT t.lang, e.slug AS id, t.name, t.hint,
           (SELECT coalesce(json_object_agg(x.au, x.level ORDER BY x.au), '{}')
              FROM expression_units x WHERE x.expression_id = e.id AND x.role = 'need') AS need,
           (SELECT coalesce(json_agg(x.au ORDER BY x.au), '[]')
              FROM expression_units x WHERE x.expression_id = e.id AND x.role = 'avoid') AS avoid
    FROM expressions e JOIN expression_texts t ON t.expression_id = e.id
    ORDER BY t.lang, e.position`,

  prompts: `
    SELECT t.lang, t.text
    FROM poker_prompts p JOIN poker_prompt_texts t ON t.prompt_id = p.id
    ORDER BY t.lang, p.position`,

  scenarios: `
    SELECT t.lang, s.slug AS id, t.name, t.prompt
    FROM scenarios s JOIN scenario_texts t ON t.scenario_id = s.id
    ORDER BY t.lang, s.position`,

  measures: `
    SELECT t.lang, m.slug, m.evidence, t.title, t.reading
    FROM report_measures m JOIN report_measure_texts t ON t.measure = m.slug
    ORDER BY t.lang, m.position`,

  tests: `
    SELECT tt.lang, t.slug AS id, t.kind, tt.name, tt.kicker, tt.blurb,
           (SELECT json_agg(json_build_object(
                     'id', q.slug, 'prompt', qt.prompt, 'title', qt.title, 'cue', qt.cue, 'why', qt.why,
                     'place', qt.place, 'pose', q.pose, 'scene', q.scene,
                     'photoFile', q.photo_file, 'who', q.photo_who, 'frame', q.photo_frame, 'credit', qt.credit,
                     'options', (SELECT json_agg(ot.label ORDER BY o.position)
                                   FROM options o JOIN option_texts ot ON ot.option_id = o.id AND ot.lang = tt.lang
                                  WHERE o.question_id = q.id),
                     'answerIndex', (SELECT o.position - 1 FROM options o WHERE o.question_id = q.id AND o.is_correct)
                   ) ORDER BY q.position)
              FROM questions q JOIN question_texts qt ON qt.question_id = q.id AND qt.lang = tt.lang
             WHERE q.test_id = t.id) AS items
    FROM tests t JOIN test_texts tt ON tt.test_id = t.id
    ORDER BY tt.lang, t.position`,
}

const byLang = (list) => list.reduce((acc, r) => ((acc[r.lang] ||= []).push(r), acc), {})
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined))

// A photo as the pages use it. src is relative ('images/eyes/afraid'): the website adds its own base.
function photo(it, kind) {
  const p = { src: it.photoFile, file: `${it.photoFile}.jpg`, credit: it.credit, who: it.who }
  if (kind === 'eyes') p.crop = it.frame?.crop ?? null
  if (kind === 'body') p.veil = it.frame?.veil ?? null
  return p
}

export async function loadContent() {
  const parts = Object.fromEntries(await Promise.all(Object.entries(SQL).map(async ([k, text]) => [k, byLang(await rows(text))])))
  const langs = {}
  for (const lang of Object.keys(parts.bodyParts)) {
    langs[lang] = {
      STRENGTH: Object.fromEntries(parts.evidence[lang].map((r) => [r.code, r.label])),
      REGION_INFO: Object.fromEntries(parts.bodyParts[lang].map((r) => [r.slug, drop({
        name: r.name, short: r.short_name, line: r.line, feels: r.feels, parts: r.parts, says: r.says,
      })])),
      BODY_MAPS: parts.feelings[lang].map(({ lang: _, ...r }) => r),
      UNITS: parts.units[lang].map(({ lang: _, ...r }) => r),
      TARGETS: parts.expressions[lang].map(({ lang: _, ...r }) => r),
      PROMPTS: parts.prompts[lang].map((r) => r.text),
      SCENARIOS: parts.scenarios[lang].map(({ lang: _, ...r }) => r),
      MEASURES: Object.fromEntries(parts.measures[lang].map((r) => [r.slug, { title: r.title, read: r.reading, strength: r.evidence }])),
      TESTS: parts.tests[lang].map(({ lang: _, items, ...t }) => ({
        ...t,
        items: items.map((it) => drop({
          id: it.id, prompt: it.prompt, options: it.options, answerIndex: it.answerIndex, answer: it.options[it.answerIndex],
          title: it.title, cue: it.cue, why: it.why, place: it.place, pose: it.pose, scene: it.scene,
          [t.kind === 'eyes' ? 'image' : 'photo']: photo(it, t.kind),
        })),
      })),
    }
  }
  return langs
}
