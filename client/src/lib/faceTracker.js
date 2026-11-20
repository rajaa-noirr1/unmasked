// Face tracking in the browser with Google's MediaPipe Face Landmarker. It is only downloaded when
// someone turns the Mirror on (around 12 MB, from public CDNs). Video never leaves the device.
const VERSION = '0.10.3'
const LIB = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let loading = null
function loadVision() {
  loading ||= import(/* @vite-ignore */ LIB).then((m) => m.default || m).catch((err) => { loading = null; throw err })
  return loading
}

export async function createTracker() {
  const { FaceLandmarker, FilesetResolver } = await loadVision()
  const fileset = await FilesetResolver.forVisionTasks(`${LIB}/wasm`)
  const make = (delegate) => FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    outputFaceBlendshapes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  })
  let landmarker
  try { landmarker = await make('GPU') } catch { landmarker = await make('CPU') }
  const F = FaceLandmarker
  return {
    detect: (video, t) => landmarker.detectForVideo(video, t),
    close: () => landmarker.close(),
    lines: {
      mesh: F.FACE_LANDMARKS_TESSELATION,
      contours: [...F.FACE_LANDMARKS_LEFT_EYE, ...F.FACE_LANDMARKS_RIGHT_EYE, ...F.FACE_LANDMARKS_LEFT_EYEBROW, ...F.FACE_LANDMARKS_RIGHT_EYEBROW, ...F.FACE_LANDMARKS_LIPS, ...F.FACE_LANDMARKS_FACE_OVAL],
      brows: [...F.FACE_LANDMARKS_LEFT_EYEBROW, ...F.FACE_LANDMARKS_RIGHT_EYEBROW],
      eyes: [...F.FACE_LANDMARKS_LEFT_EYE, ...F.FACE_LANDMARKS_RIGHT_EYE],
      mouth: F.FACE_LANDMARKS_LIPS,
    },
  }
}


// ── drawing ──────────────────────────────────────────────────────────────────────────────────────
// Everything is drawn in hairlines over the mirrored video: the mesh, the contours, the zones that
// are moving (gold), a layer of geometry measured from the face, and the working muscles labelled.
// Measurements are in units of the distance between the eye centres (d), the usual way to make
// faces of different sizes and distances comparable. `view.s` is canvas pixels per CSS pixel;
// `view.x0..x1` is the part of the canvas visible inside its frame; `view.lang` is 'en' or 'ckb'.

const GOLD = (a) => `rgba(240, 194, 90, ${a})`
const BONE = (a) => `rgba(239, 230, 220, ${a})`
const WORDS = {
  roll: ['head tilt', 'لاربوونی سەر'],
  curve: ['mouth curve', 'چەمانەوەی دەم'],
  asym: ['asymmetry', 'ناهاوسەنگی'],
  dist: ['eye distance', 'دووری چاوەکان'],
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1])
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const signed = (x, digits = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(digits)}`

export function drawMesh(ctx, landmarks, lines, zones, labels, w, h, view) {
  ctx.clearRect(0, 0, w, h)
  if (!landmarks) return
  const { s, x0, x1, lang = 'en' } = view
  const hair = 0.6 * s
  const P = (i) => [(1 - landmarks[i].x) * w, landmarks[i].y * h]
  const stroke = (conns, style, width) => {
    ctx.strokeStyle = style
    ctx.lineWidth = width
    ctx.beginPath()
    for (const c of conns) { const a = P(c.start), b = P(c.end); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
    ctx.stroke()
  }
  const line = (a, b, style, width = hair, dash) => {
    ctx.strokeStyle = style
    ctx.lineWidth = width
    ctx.setLineDash(dash || [])
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
    ctx.setLineDash([])
  }
  const text = (str, x, y, { size = 11, color = BONE(0.75), align = 'left', mono = false, rtl = false } = {}) => {
    ctx.font = `${mono ? '500' : '400'} ${size * s}px ${mono ? 'ui-monospace, "Cascadia Mono", Consolas, monospace' : '"Roboto Flex Variable", "Zain", system-ui, sans-serif'}`
    ctx.direction = rtl ? 'rtl' : 'ltr'
    ctx.textAlign = align
    ctx.fillStyle = color
    ctx.fillText(str, x, y)
    ctx.direction = 'ltr'
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(5, 3, 4, 0.9)'
  ctx.shadowBlur = 3 * s

  // the mesh and the contours, as hairlines; moving zones in gold
  stroke(lines.mesh, BONE(0.07), hair * 0.8)
  stroke(lines.contours, BONE(0.4), hair)
  for (const z of ['brows', 'eyes', 'mouth']) if (zones[z] > 0.3) stroke(lines[z], GOLD(Math.min(1, 0.45 + zones[z])), hair * 1.5)

  // ── the geometry layer ──
  const eA = mid(P(33), P(133)), eB = mid(P(263), P(362))
  const [eL, eR] = eA[0] < eB[0] ? [eA, eB] : [eB, eA] // left and right as seen on screen
  const d = len(sub(eR, eL)) || 1
  const ux = mul(sub(eR, eL), 1 / d)
  const up = [ux[1], -ux[0]]
  const down = mul(up, -1)
  const roll = (Math.atan2(ux[1], ux[0]) * 180) / Math.PI

  // the eye line, extended, and the tilt of the head as an angle
  line(add(eL, mul(ux, -0.45 * d)), add(eR, mul(ux, 0.45 * d)), BONE(0.32), hair, [3 * s, 5 * s])
  const anchor = add(eL, mul(ux, -0.45 * d))
  const r = 0.28 * d
  line(anchor, add(anchor, [-r * 1.2, 0]), BONE(0.32), hair)
  ctx.strokeStyle = GOLD(0.85)
  ctx.lineWidth = hair
  ctx.beginPath()
  const a0 = Math.PI, a1 = Math.PI + (roll * Math.PI) / 180
  ctx.arc(anchor[0], anchor[1], r, Math.min(a0, a1), Math.max(a0, a1))
  ctx.stroke()
  text(`θ ${signed(roll, 1)}°`, anchor[0] - r * 1.25, anchor[1] - 6 * s, { color: GOLD(0.95), align: 'right', mono: true })

  // the midline of the face, with a tick every eighth
  const top = P(10), chin = P(152)
  const axis = sub(chin, top), al = len(axis) || 1, av = mul(axis, 1 / al), an = [-av[1], av[0]]
  line(add(top, mul(av, -0.14 * al)), add(chin, mul(av, 0.1 * al)), BONE(0.28), hair, [2 * s, 6 * s])
  for (let k = 0; k <= 8; k++) {
    const p = add(top, mul(av, (al * k) / 8))
    const t = (k % 4 === 0 ? 7 : 4) * s
    line(add(p, mul(an, -t)), add(p, mul(an, t)), BONE(k % 4 === 0 ? 0.5 : 0.3), hair)
  }

  // brow height on each side: brow to upper lid, as a dimension line beside the eye
  const brows = []
  for (const [brow, lid] of [[105, 159], [334, 386]]) {
    const b = P(brow), l = P(lid)
    const hgt = dot(sub(l, b), down)
    const side = b[0] < (eL[0] + eR[0]) / 2 ? -1 : 1
    const off = mul(ux, side * 0.5 * d)
    const a = add(b, off), z = add(a, mul(down, hgt))
    line(a, z, BONE(0.55), hair)
    for (const q of [a, z]) line(add(q, mul(ux, -3 * s)), add(q, mul(ux, 3 * s)), BONE(0.55), hair)
    const value = hgt / d
    brows.push(value)
    const lp = add(mid(a, z), mul(ux, side * 6 * s))
    text(value.toFixed(2), lp[0], lp[1] + 4 * s, { color: GOLD(0.95), align: side < 0 ? 'right' : 'left', mono: true })
  }

  // the mouth: a parabola fitted through both corners and the centre of the lips
  const cA = P(61), cB = P(291)
  const [cL, cR] = cA[0] < cB[0] ? [cA, cB] : [cB, cA]
  const c = mid(P(13), P(14))
  const loc = (p) => [dot(sub(p, c), ux), dot(sub(p, c), up)]
  const [uL, vL] = loc(cL), [uR, vR] = loc(cR)
  let curve = 0
  if (Math.abs(uL) > 1 && Math.abs(uR) > 1 && Math.abs(uL - uR) > 1) {
    const a = (vL * uR - vR * uL) / (uL * uR * (uL - uR))
    const b = (vL - a * uL * uL) / uL
    curve = a * d
    ctx.strokeStyle = GOLD(0.9)
    ctx.lineWidth = hair * 1.2
    ctx.beginPath()
    for (let k = 0; k <= 40; k++) {
      const u = uL * 1.18 + ((uR * 1.18 - uL * 1.18) * k) / 40
      const v = a * u * u + b * u
      const p = add(c, add(mul(ux, u), mul(up, v)))
      if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1])
    }
    ctx.stroke()
    text(`κ ${signed(curve)}`, cR[0] + 0.22 * d, cR[1] + 4 * s, { color: GOLD(0.95), mono: true })
  }
  // mouth opening, when there is one
  const open = dot(sub(P(14), P(13)), down) / d
  if (open > 0.04) {
    const a = P(13), z = P(14)
    line(a, z, GOLD(0.85), hair)
    for (const q of [a, z]) line(add(q, mul(ux, -3 * s)), add(q, mul(ux, 3 * s)), GOLD(0.85), hair)
    text(`h ${open.toFixed(2)}`, c[0] - 0.14 * d, c[1] + 4 * s, { color: GOLD(0.95), align: 'right', mono: true })
  }

  // the readout, in the bottom corner of the frame
  const rows = [
    ['θ', `${signed(roll, 1)}°`, WORDS.roll],
    ['κ', signed(curve), WORDS.curve],
    ['Δ', Math.abs(brows[0] - brows[1]).toFixed(2), WORDS.asym],
    ['d', `${Math.round(d / s)} px`, WORDS.dist],
  ]
  const rtl = lang === 'ckb'
  const bx = x0 + 18 * s, by = h - 18 * s - (rows.length - 1) * 17 * s
  rows.forEach(([sym, val, words], i) => {
    const y = by + i * 17 * s
    text(sym, bx, y, { color: GOLD(0.95), mono: true })
    text(val, bx + 16 * s, y, { color: BONE(0.9), mono: true })
    text(words[rtl ? 1 : 0], rtl ? bx + 190 * s : bx + 86 * s, y, { color: BONE(0.5), size: 11, align: rtl ? 'right' : 'left', rtl })
  })
  ctx.restore()

  // ── the working muscles, labelled like an anatomical plate ──
  if (!labels.length) return
  let minX = Infinity, maxX = -Infinity
  for (const p of landmarks) { const x = (1 - p.x) * w; if (x < minX) minX = x; if (x > maxX) maxX = x }
  const centre = (minX + maxX) / 2
  const fs = 15 * s
  const items = labels.map((l) => { const [x, y] = P(l.lm); return { ...l, x, y, left: x < centre } })
  ctx.save()
  ctx.shadowColor = 'rgba(5, 3, 4, 0.95)'
  ctx.shadowBlur = 6 * s
  for (const left of [true, false]) {
    const side = items.filter((it) => it.left === left).sort((a, b) => a.y - b.y)
    let prev = -Infinity
    for (const it of side) { it.ly = Math.min(h - fs * 5, Math.max(it.y, prev + fs * 2.6)); prev = it.ly }
    for (const it of side) {
      ctx.font = `italic 400 ${fs}px "Newsreader Variable", Georgia, serif`
      const tw = ctx.measureText(it.name).width
      let tx = left ? minX - 30 * s : maxX + 30 * s
      tx = left ? Math.max(tx, x0 + 12 * s + tw) : Math.min(tx, x1 - 12 * s - tw)
      const lx = left ? tx + 6 * s : tx - 6 * s
      const a = 0.45 + 0.55 * Math.min(1, it.level)
      line([it.x, it.y], [lx, it.ly], GOLD(a), hair)
      // a fine cross marks the muscle, not a dot
      const k = 4 * s
      line([it.x - k, it.y], [it.x + k, it.y], GOLD(a), hair)
      line([it.x, it.y - k], [it.x, it.y + k], GOLD(a), hair)
      ctx.textAlign = left ? 'right' : 'left'
      ctx.fillStyle = BONE(0.95)
      ctx.fillText(it.name, tx, it.ly + fs * 0.32)
      ctx.font = `500 ${fs * 0.68}px ui-monospace, "Cascadia Mono", Consolas, monospace`
      ctx.fillStyle = GOLD(a)
      ctx.fillText(`AU${it.au}  ${Math.round(Math.min(1, it.level) * 100)}%`, tx, it.ly + fs * 1.4)
    }
  }
  ctx.restore()
}
