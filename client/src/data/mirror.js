// The Mirror reports muscles, never feelings. Face tracking in the browser gives "blendshapes"
// (how much each part of the face is moving); here they are mapped onto the action units of the
// Facial Action Coding System. The mapping is approximate, and the page says so.
// `muscle` is the muscle FACS gives for each unit; `lm` is the face-mesh point its label points at.
export const UNITS = [
  { au: 1, name: 'Inner brow raiser', plain: 'Inner brows lifted', muscle: 'Frontalis, inner part', lm: 107, shapes: ['browInnerUp'], gain: 1.3, zone: 'brows' },
  { au: 2, name: 'Outer brow raiser', plain: 'Outer brows lifted', muscle: 'Frontalis, outer part', lm: 334, shapes: ['browOuterUpLeft', 'browOuterUpRight'], gain: 1.5, zone: 'brows' },
  { au: 4, name: 'Brow lowerer', plain: 'Brows pulled down and together', muscle: 'Corrugator supercilii', lm: 9, shapes: ['browDownLeft', 'browDownRight'], gain: 1.6, zone: 'brows' },
  { au: 5, name: 'Upper lid raiser', plain: 'Eyes opened wide', muscle: 'Levator palpebrae superioris', lm: 159, shapes: ['eyeWideLeft', 'eyeWideRight'], gain: 2.2, zone: 'eyes' },
  { au: 6, name: 'Cheek raiser', plain: 'Cheeks lifted, eye corners crinkled', muscle: 'Orbicularis oculi, outer ring', lm: 263, shapes: ['cheekSquintLeft', 'cheekSquintRight'], gain: 1.9, zone: 'eyes' },
  { au: 7, name: 'Lid tightener', plain: 'Eyes narrowed', muscle: 'Orbicularis oculi, eyelids', lm: 145, shapes: ['eyeSquintLeft', 'eyeSquintRight'], gain: 1.7, zone: 'eyes' },
  { au: 43, name: 'Eyes closed', plain: 'Eyelids closing', muscle: 'Levator palpebrae, letting go', lm: 386, shapes: ['eyeBlinkLeft', 'eyeBlinkRight'], gain: 1.1, zone: 'eyes' },
  { au: 9, name: 'Nose wrinkler', plain: 'Nose wrinkled', muscle: 'Levator labii superioris alaeque nasi', lm: 98, shapes: ['noseSneerLeft', 'noseSneerRight'], gain: 2.2, zone: 'nose' },
  { au: 12, name: 'Lip corner puller', plain: 'Mouth corners pulled up', muscle: 'Zygomaticus major', lm: 425, shapes: ['mouthSmileLeft', 'mouthSmileRight'], gain: 1.3, zone: 'mouth' },
  { au: 14, name: 'Dimpler', plain: 'Mouth corners tightened', muscle: 'Buccinator', lm: 61, shapes: ['mouthDimpleLeft', 'mouthDimpleRight'], gain: 2.6, zone: 'mouth' },
  { au: 15, name: 'Lip corner depressor', plain: 'Mouth corners pulled down', muscle: 'Depressor anguli oris', lm: 321, shapes: ['mouthFrownLeft', 'mouthFrownRight'], gain: 2.2, zone: 'mouth' },
  { au: 17, name: 'Chin raiser', plain: 'Chin pushed up', muscle: 'Mentalis', lm: 199, shapes: ['mouthShrugLower'], gain: 1.8, zone: 'mouth' },
  { au: 20, name: 'Lip stretcher', plain: 'Lips stretched sideways', muscle: 'Risorius', lm: 291, shapes: ['mouthStretchLeft', 'mouthStretchRight'], gain: 2.4, zone: 'mouth' },
  { au: 24, name: 'Lip pressor', plain: 'Lips pressed together', muscle: 'Orbicularis oris', lm: 0, shapes: ['mouthPressLeft', 'mouthPressRight'], gain: 2.0, zone: 'mouth' },
  { au: 26, name: 'Jaw drop', plain: 'Jaw dropped open', muscle: 'Masseter, released', lm: 152, shapes: ['jawOpen'], gain: 1.4, zone: 'mouth' },
]

// Blendshape scores → { au: 0..1 }
export function toUnits(categories) {
  const score = Object.fromEntries((categories || []).map((c) => [c.categoryName, c.score]))
  const out = {}
  for (const u of UNITS) {
    const v = u.shapes.reduce((a, s) => a + (score[s] || 0), 0) / u.shapes.length
    out[u.au] = Math.min(1, v * u.gain)
  }
  return out
}

// Perform it: show a pattern of muscles. `need` must reach their levels; `avoid` must stay low.
export const TARGETS = [
  { id: 'real-smile', name: 'A genuine-looking smile', hint: 'Let it reach your eyes: cheeks up, corners crinkled.', need: { 6: 0.4, 12: 0.6 }, avoid: [] },
  { id: 'polite-smile', name: 'A polite smile', hint: 'Mouth only. Keep your eyes still.', need: { 12: 0.5 }, avoid: [6] },
  { id: 'surprise', name: 'Surprise', hint: 'Brows high, eyes wide, jaw dropped.', need: { 1: 0.45, 2: 0.4, 5: 0.35, 26: 0.45 }, avoid: [4] },
  { id: 'worry', name: 'Worry', hint: 'Lift only the inner ends of your brows. It is harder than it sounds.', need: { 1: 0.55, 4: 0.2 }, avoid: [12] },
  { id: 'focus', name: 'Deep concentration', hint: 'Brows down, eyes narrowed, lips pressed.', need: { 4: 0.5, 7: 0.35, 24: 0.3 }, avoid: [12] },
  { id: 'disgust', name: 'Disgust', hint: 'Wrinkle your nose as if something smells off.', need: { 9: 0.45 }, avoid: [12] },
  { id: 'fear', name: 'Fear', hint: 'Brows up and together, eyes wide, lips stretched back.', need: { 1: 0.45, 5: 0.45, 20: 0.35 }, avoid: [12] },
  { id: 'sadness', name: 'Sadness', hint: 'Inner brows up, mouth corners down.', need: { 1: 0.45, 15: 0.35 }, avoid: [12] },
]

export function matchScore(target, units) {
  const parts = Object.entries(target.need).map(([au, lvl]) => Math.min(1, (units[au] || 0) / lvl))
  const penalty = target.avoid.reduce((a, au) => a + Math.max(0, (units[au] || 0) - 0.15), 0)
  const base = parts.reduce((a, b) => a + b, 0) / parts.length
  return Math.max(0, Math.min(1, base - penalty * 0.8))
}

// Poker face: things to read while keeping your face still.
export const PROMPTS = [
  'Imagine biting slowly into a raw lemon.',
  'Remember the most embarrassing thing you said this year.',
  'Picture your teacher dancing on the desk.',
  'Someone behind you just shouted your name.',
  'You find a forgotten banknote in an old jacket.',
  'Smell the inside of a gym bag left closed for a week.',
  'Your crush just liked your old photo from five years ago.',
  'Your phone screen cracks as it slips from your hand.',
]

// For the demo when no camera is available: a sequence of faces, as unit levels.
export const DEMO_SEQUENCE = [
  { label: 'At rest', units: {} },
  { label: 'Surprise', units: { 1: 0.8, 2: 0.8, 5: 0.7, 26: 0.7 } },
  { label: 'A real smile', units: { 6: 0.75, 12: 0.85 } },
  { label: 'Concentration', units: { 4: 0.7, 7: 0.55, 24: 0.5 } },
  { label: 'Worry', units: { 1: 0.8, 4: 0.35, 20: 0.25, 24: 0.3 } },
  { label: 'Disgust', units: { 9: 0.85, 15: 0.5, 4: 0.3, 17: 0.4 } },
  { label: 'A polite smile', units: { 12: 0.65 } },
]
