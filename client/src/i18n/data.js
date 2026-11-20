// The Map, the tests and the Mirror in the reader's language.
// Where it comes from: on the laptop, the database (through the API, see ContentProvider below). The
// files here are the built-in copy: they are what the database is seeded from (server/scripts/
// build-seed.mjs), what the GitHub Pages version shows, and what shows for the moment before the
// database answers. English is the source of truth for structure (ids, order, heat maps, which option
// is right); Kurdish overlays only the words.
import { createContext, createElement, useContext, useEffect, useState } from 'react'
import { useLang } from './index'
import { api } from '../lib/api'
import { asset } from '../lib/asset'
import * as REHEARSE from '../data/rehearse'
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

// ── content from the database ──

// The API sends both languages, shaped like dataFor(). What only the browser needs is added here: how
// the face tracker reads each muscle (lm, shapes, gain), the base address of the photos, and the demo.
function fromDatabase(langs) {
  const out = {}
  for (const [lang, c] of Object.entries(langs)) {
    const local = dataFor(lang)
    const tracking = Object.fromEntries(MIRROR.UNITS.map((u) => [u.au, u]))
    const photo = (p) => p && { ...p, src: asset(p.src) }
    out[lang] = {
      ...c,
      UNITS: c.UNITS.map((u) => ({ ...tracking[u.au], ...u })),
      TESTS: c.TESTS.map((t) => ({ ...t, items: t.items.map((it) => ({ ...it, image: photo(it.image), photo: photo(it.photo) })) })),
      DEMO_SEQUENCE: local.DEMO_SEQUENCE,
    }
  }
  // Rehearse uses [English, Kurdish] pairs
  if (out.en && out.ckb) {
    out.rehearse = {
      SCENARIOS: out.en.SCENARIOS.map((s, i) => ({ id: s.id, name: [s.name, out.ckb.SCENARIOS[i]?.name ?? s.name], prompt: [s.prompt, out.ckb.SCENARIOS[i]?.prompt ?? s.prompt] })),
      METRICS: Object.fromEntries(Object.entries(out.en.MEASURES).map(([k, m]) => [k, { strength: m.strength, title: [m.title, out.ckb.MEASURES[k]?.title ?? m.title], read: [m.read, out.ckb.MEASURES[k]?.read ?? m.read] }])),
    }
  }
  return out
}

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [remote, setRemote] = useState(null)
  useEffect(() => {
    let alive = true
    api.content().then((res) => {
      if (!alive || !res?.langs?.en) return
      try { setRemote(fromDatabase(res.langs)) } catch (e) { console.warn('Content from the database did not fit:', e) }
    })
    return () => { alive = false }
  }, [])
  return createElement(ContentContext.Provider, { value: remote }, children)
}

export function useData() {
  const { lang } = useLang()
  const remote = useContext(ContentContext)
  return remote?.[lang] || dataFor(lang)
}

// Rehearse's situations and report measures, as [English, Kurdish] pairs
export function useRehearseContent() {
  const remote = useContext(ContentContext)
  return remote?.rehearse || { SCENARIOS: REHEARSE.SCENARIOS, METRICS: REHEARSE.METRICS }
}

// 'database' once the API has answered, 'built-in' otherwise
export function useContentSource() {
  return useContext(ContentContext) ? 'database' : 'built-in'
}
