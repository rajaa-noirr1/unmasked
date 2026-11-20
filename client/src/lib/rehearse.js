// Turns 45 seconds of muscle readings (ten samples a second) into a Rehearse report.
// Each sample: { u: { au: level }, roll: degrees, face: boolean, blinks: count since the start }.
const ON = 0.32
const MOVING = [1, 2, 4, 5, 6, 7, 9, 12, 14, 15, 17, 20, 24, 26]

// runs of samples where a level climbs over `on` and stays over `off`, at least `min` samples long
function runs(samples, get, on, off, min) {
  const out = []
  let cur = null
  samples.forEach((s, i) => {
    const v = s.face ? get(s) : 0
    if (!cur && v > on) cur = { start: i, end: i, samples: [s] }
    else if (cur && v > off) { cur.end = i; cur.samples.push(s) }
    else if (cur) { if (cur.end - cur.start + 1 >= min) out.push(cur); cur = null }
  })
  if (cur && cur.end - cur.start + 1 >= min) out.push(cur)
  return out
}

export function summarize(samples, seconds) {
  const n = samples.length || 1
  const seen = samples.filter((s) => s.face)
  const m = seen.length || 1
  const pct = (pred) => Math.round((100 * seen.filter(pred).length) / m)
  const lv = (s, au) => s.u[au] || 0

  const smiles = runs(samples, (s) => lv(s, 12), 0.4, 0.3, 3)
  const presses = runs(samples, (s) => lv(s, 24), 0.35, 0.25, 2)
  const blinks = samples.length ? samples[samples.length - 1].blinks : 0

  // a light timeline for the chart: at most 150 points
  const step = Math.max(1, Math.ceil(samples.length / 150))
  const timeline = []
  for (let i = 0; i < samples.length; i += step) {
    const chunk = samples.slice(i, i + step)
    const max = (fn) => Math.max(0, ...chunk.map(fn))
    const before = i > 0 ? samples[i - 1].blinks : 0
    timeline.push([
      max((s) => (s.face ? lv(s, 12) : 0)),
      max((s) => (s.face ? Math.max(lv(s, 1), lv(s, 2)) : 0)),
      max((s) => (s.face && lv(s, 24) > 0.35 ? 1 : 0)),
      chunk[chunk.length - 1].blinks > before ? 1 : 0,
    ])
  }

  return {
    faceShare: Math.round((100 * seen.length) / n),
    blinksPerMin: Math.round(blinks / Math.max(seconds / 60, 0.1)),
    smiles: smiles.length,
    smilesEyes: smiles.filter((r) => r.samples.some((s) => lv(s, 6) > 0.3)).length,
    presses: presses.length,
    browUp: pct((s) => Math.max(lv(s, 1), lv(s, 2)) > 0.35),
    browDown: pct((s) => lv(s, 4) > 0.4),
    still: pct((s) => MOVING.every((au) => lv(s, au) <= ON)),
    tilt: pct((s) => Math.abs(s.roll) > 8),
    timeline,
  }
}
