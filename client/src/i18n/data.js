// The Map, the tests and the Mirror in the reader's language. English is the source of truth for
// structure (ids, order, heat maps, which option is right); Kurdish overlays only the words.
import { useLang } from './index'
import * as BODY from '../data/body'
import * as TESTS_EN from '../data/tests'
import * as MIRROR from '../data/mirror'
import * as CKB_BODY from './ckb/body'
import * as CKB_TESTS from './ckb/tests'
import * as CKB_MIRROR from './ckb/mirror'
import { STILLS } from '../data/photos'

function english() {
  return {
    STRENGTH: BODY.STRENGTH,
    REGION_INFO: Object.fromEntries(Object.entries(BODY.REGION_INFO).map(([k, v]) => [k, { ...v, short: v.name.split(' and ')[0] }])),
    BODY_MAPS: BODY.BODY_MAPS,
    // the right answer is kept as a position, so it survives translation
    TESTS: TESTS_EN.TESTS.map((t) => ({ ...t, items: t.items.map((it) => ({ ...it, answerIndex: it.options.indexOf(it.answer) })) })),
    UNITS: MIRROR.UNITS,
    TARGETS: MIRROR.TARGETS,
    PROMPTS: MIRROR.PROMPTS,
    DEMO_SEQUENCE: MIRROR.DEMO_SEQUENCE,
  }
}

function kurdish(en) {
  const R = CKB_BODY.REGION_INFO
  const credit = (img) => img && (img.credit === STILLS ? { ...img, credit: CKB_TESTS.STILLS } : img)
  return {
    STRENGTH: CKB_BODY.STRENGTH,
    REGION_INFO: Object.fromEntries(Object.entries(en.REGION_INFO).map(([k, v]) => [k, { ...v, ...R[k], says: v.says.map((s, i) => ({ ...s, ...(R[k]?.says?.[i] || {}) })) }])),
    BODY_MAPS: en.BODY_MAPS.map((m) => ({ ...m, ...(CKB_BODY.BODY_MAPS[m.id] || {}) })),
    TESTS: en.TESTS.map((t) => {
      const o = CKB_TESTS.TESTS[t.id] || {}
      return {
        ...t, name: o.name || t.name, kicker: o.kicker || t.kicker, blurb: o.blurb || t.blurb,
        items: t.items.map((it) => {
          const x = o.items?.[it.id]
          if (!x) return it
          const options = x.options?.length === it.options.length ? x.options : it.options
          return { ...it, ...x, options, answer: options[it.answerIndex], image: credit(it.image), photo: credit(it.photo) }
        }),
      }
    }),
    UNITS: en.UNITS.map((u) => ({ ...u, ...(CKB_MIRROR.UNITS[u.au] || {}) })),
    TARGETS: en.TARGETS.map((t) => ({ ...t, ...(CKB_MIRROR.TARGETS[t.id] || {}) })),
    PROMPTS: CKB_MIRROR.PROMPTS,
    DEMO_SEQUENCE: en.DEMO_SEQUENCE.map((d, i) => ({ ...d, label: CKB_MIRROR.DEMO_LABELS[i] || d.label })),
  }
}

const cache = {}
export function dataFor(lang) {
  if (!cache.en) cache.en = english()
  if (lang === 'ckb' && !cache.ckb) cache.ckb = kurdish(cache.en)
  return cache[lang] || cache.en
}

export function useData() {
  const { lang } = useLang()
  return dataFor(lang)
}
