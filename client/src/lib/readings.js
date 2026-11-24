// How you might come across: five readings (0 to 100) made from the cues in a Rehearse report.
// They are a guess at what people may read into those seconds, built from cues people tend to react to:
// fast blinking, pressed lips, smiles that miss the eyes, a frozen face, looking away, raised brows.
// They are not what anyone felt, and the lying one is not a lie detector: nothing can detect lies from a
// face (people manage about 54%, Bond and DePaulo 2006). The page says so beside them.
//
// Each reading is a weighted mix of the cues below, each cue scaled from 0 (none) to 1 (a lot, for ten
// seconds of talking). The two cues that added the most are shown with it, so every number explains itself.

const clamp = (v) => Math.max(0, Math.min(1, v))

// the cues, and how each is named when it explains a reading
export const CUES = {
  blinks: ['fast blinking', 'چاوترووکاندنی خێرا'],
  presses: ['pressed lips', 'لێوی پەستێنراو'],
  frown: ['lowered brows', 'برۆی داگیراو'],
  polite: ['smiles that missed the eyes', 'زەردەخەنەی نەگەیشتوو بە چاو'],
  still: ['a still face', 'دەموچاوی بێجووڵە'],
  away: ['looking away', 'سەیرکردنی لاوە'],
  brows: ['raised brows', 'برۆی بەرز'],
  smiles: ['real smiles', 'زەردەخەنەی ڕاستەقینە'],
  lively: ['a lively face', 'دەموچاوی زیندوو'],
  steady: ['few signs of strain', 'نیشانەی کەمی گرژی'],
}

// in the order they are shown; tone is the colour (artery red, gold, vein blue)
export const READINGS = [
  { id: 'lying', name: ['Lying', 'درۆکردن'], tone: 'red' },
  { id: 'hiding', name: ['Hiding something', 'شاردنەوەی شتێک'], tone: 'red' },
  { id: 'nervous', name: ['Nervous', 'دڵەڕاوکێ'], tone: 'gold' },
  { id: 'excited', name: ['Excited', 'بەجۆش'], tone: 'gold' },
  { id: 'calm', name: ['Calm', 'ئارام'], tone: 'blue' },
]

// r: a report (or the running numbers while recording); seconds: how long it ran
export function readings(r, seconds = 10) {
  const per10 = 10 / Math.max(seconds, 1)
  const smiles = r.smiles || 0
  const real = smiles ? (r.smilesEyes || 0) / smiles : 0
  const c = {
    blinks: clamp(((r.blinksPerMin || 0) - 20) / 30),        // about 26 a minute is usual while talking
    presses: clamp(((r.presses || 0) * per10) / 3),
    frown: clamp((r.browDown || 0) / 40),
    polite: smiles ? clamp((1 - real) * Math.max(clamp((smiles * per10) / 2.5), 0.4)) : 0,
    still: clamp((r.still || 0) / 100),
    away: clamp((100 - (r.faceShare ?? 100)) / 40),
    brows: clamp((r.browUp || 0) / 45),
    smiles: clamp((smiles * per10) / 2.5) * (0.5 + 0.5 * real),
    lively: clamp(1 - (r.still || 0) / 100),
  }
  const mix = (parts) => {
    const terms = Object.entries(parts).map(([cue, w]) => [cue, w * (c[cue] ?? 0)])
    const value = clamp(terms.reduce((sum, [, v]) => sum + v, 0))
    const why = terms.filter(([, v]) => v > 0.04).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([cue]) => cue)
    return { value, why }
  }
  const nervous = mix({ blinks: 0.4, presses: 0.25, frown: 0.2, polite: 0.15 })
  const hiding = mix({ presses: 0.35, still: 0.3, polite: 0.2, away: 0.15 })
  const lying = mix({ blinks: 0.3, presses: 0.25, away: 0.2, polite: 0.15, still: 0.1 })
  lying.value = clamp(lying.value - 0.15 * c.smiles)            // real smiles read as open
  const excited = mix({ brows: 0.4, smiles: 0.35, lively: 0.25 })
  const calmValue = clamp(1 - 0.6 * nervous.value - 0.4 * hiding.value - 0.2 * excited.value)
  const calm = { value: calmValue, why: calmValue > 0.4 ? ['steady', ...(c.still > 0.5 ? ['still'] : [])] : [] }
  const out = { lying, hiding, nervous, excited, calm }
  for (const k of Object.keys(out)) out[k] = { percent: Math.round(out[k].value * 100), why: out[k].why }
  return out
}
