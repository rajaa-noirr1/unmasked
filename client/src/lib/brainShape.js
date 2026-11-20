// A brain as a cloud of points: two folded hemispheres, the cerebellum and the brain stem.
// x = left/right, y = up, z = front (+) / back (-). Every point is tagged with the region it
// belongs to, so the hero can light up a whole lobe and say what it does.
export const REGIONS = ['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'brainstem']

const seeded = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Ken Perlin's improved noise, for the folds of the cortex
function makeNoise(rand) {
  const perm = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]] }
  const p = new Uint8Array(512)
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a, b, t) => a + t * (b - a)
  const grad = (h, x, y, z) => {
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }
  return (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z)
    const u = fade(x), v = fade(y), w = fade(z)
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z
    return lerp(
      lerp(lerp(grad(p[AA] & 15, x, y, z), grad(p[BA] & 15, x - 1, y, z), u), lerp(grad(p[AB] & 15, x, y - 1, z), grad(p[BB] & 15, x - 1, y - 1, z), u), v),
      lerp(lerp(grad(p[AA + 1] & 15, x, y, z - 1), grad(p[BA + 1] & 15, x - 1, y, z - 1), u), lerp(grad(p[AB + 1] & 15, x, y - 1, z - 1), grad(p[BB + 1] & 15, x - 1, y - 1, z - 1), u), v),
      w,
    )
  }
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

function unit(rand) {
  let x, y, z, l
  do { x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1; l = x * x + y * y + z * z } while (l > 1 || l < 1e-4)
  l = Math.sqrt(l)
  return [x / l, y / l, z / l]
}

// the lateral (Sylvian) fissure rises toward the back; the central sulcus runs from the crown down and forward
const sylvian = (z) => -0.03 - 0.3 * (z - 0.05)
const central = (y) => 0.14 - 0.34 * (y / 0.56)

export function makeBrain(count, seed = 11) {
  const rand = seeded(seed)
  const n1 = makeNoise(rand), n2 = makeNoise(rand)
  const pos = [], col = [], reg = []
  const push = (x, y, z, c, r) => { pos.push(x, y, z); col.push(c[0], c[1], c[2]); reg.push(r) }
  const want = { cerebrum: Math.round(count * 0.84), cerebellum: Math.round(count * 0.11) }
  want.brainstem = count - want.cerebrum - want.cerebellum

  // ── cerebrum ──
  let made = 0, tries = 0
  while (made < want.cerebrum && tries++ < count * 60) {
    const s = rand() < 0.5 ? -1 : 1
    const [ux, uy, uz] = unit(rand)
    const inner = ux * s < 0
    let x = inner ? s * (0.36 - 0.348 * Math.pow(Math.abs(ux), 0.3)) : s * (0.36 + 0.38 * Math.abs(ux))
    let y = uy * 0.56
    let z = uz * 0.86
    if (y < 0) y *= 0.62
    x *= 1 - 0.12 * Math.max(0, uz) ** 2 - 0.2 * Math.max(0, -uz) ** 2
    if (uy > 0) y *= 1 - 0.2 * uz * uz
    // the temporal lobe bulges down and out at the side, toward the front
    const side = inner ? 0 : smooth(0.15, 0.7, Math.abs(ux))
    const t = Math.exp(-(((z - 0.14) / 0.34) ** 2)) * Math.max(0, -uy) * side
    y -= 0.17 * t
    x += s * 0.05 * t
    // folds: the zero lines of warped noise are the grooves (sulci), the rest are ridges (gyri)
    const wx = n2(x * 2.1, y * 2.1, z * 2.1) * 0.35
    const fold = n1(x * 4.3 + wx, y * 4.3 + 7.1, z * 4.3 - wx)
    const ridge = Math.abs(fold)
    // the groove itself is empty; the rim of each fold is traced in bright points; a dim fill between
    if (ridge < 0.045) continue
    // the two great landmarks, drawn as clean grooves on the outer side
    if (!inner && z > -0.42 && z < 0.56 && Math.abs(y - sylvian(z)) < 0.03) continue
    if (y > sylvian(z) + 0.04 && Math.abs(z - central(y)) < 0.022) continue
    if (inner && Math.abs(x) < 0.03 && rand() < 0.5) continue
    const rim = Math.abs(ridge - 0.16) < 0.024
    if (!rim && rand() > 0.13) continue
    // ridges stand out a little, grooves sink
    const out = 0.024 * smooth(0.06, 0.3, ridge) - 0.012
    const nx = x - s * 0.36, ny = y, nz = z
    const nl = Math.hypot(nx / 0.38, ny / 0.56, nz / 0.86) || 1
    x += (nx / nl) * out; y += (ny / nl) * out; z += (nz / nl) * out
    const temporal = !inner && y < sylvian(z) && z > -0.6 && z < 0.66
    const region = temporal ? 2 : z < -0.6 ? 3 : z > central(y) ? 0 : 1
    const shade = rim ? 0.82 + rand() * 0.18 : 0.26 + rand() * 0.14
    push(x, y, z, [0.95 * shade, 0.88 * shade, 0.8 * shade], region)
    made++
  }

  // ── cerebellum: two small lobes under the back of the brain, finely striped ──
  made = 0; tries = 0
  while (made < want.cerebellum && tries++ < count * 30) {
    const s = rand() < 0.5 ? -1 : 1
    const [ux, uy, uz] = unit(rand)
    const x = s * 0.19 + ux * 0.25, y = -0.38 + uy * 0.19, z = -0.56 + uz * 0.26
    if ((x / 0.74) ** 2 + (y / 0.36) ** 2 + (z / 0.86) ** 2 < 0.9 && y > -0.3) continue
    const stripe = Math.sin((y + 0.38) * 82 + n1(x * 3, y * 3, z * 3) * 4)
    if (Math.abs(stripe) > 0.6 && rand() < 0.85) continue
    const shade = 0.65 + rand() * 0.3
    push(x, y, z, [0.6 * shade, 0.7 * shade, 1.0 * shade], 4)
    made++
  }

  // ── brain stem ──
  for (let i = 0; i < want.brainstem; i++) {
    const t = rand(), a = rand() * Math.PI * 2
    const r = 0.1 - 0.025 * t
    const y = -0.22 - t * 0.62, z = -0.2 - 0.12 * t
    const shade = 0.55 + rand() * 0.3
    push(Math.cos(a) * r, y, z + Math.sin(a) * r * 0.9, [0.5 * shade, 0.6 * shade, 0.95 * shade], 5)
  }

  // shuffle, so any slice of the cloud (the first few hundred carry the connecting lines) covers the whole brain
  const total = reg.length
  const order = Array.from({ length: total }, (_, i) => i)
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
  const positions = new Float32Array(total * 3), colors = new Float32Array(total * 3), regions = new Float32Array(total)
  order.forEach((from, to) => {
    positions.set(pos.slice(from * 3, from * 3 + 3), to * 3)
    colors.set(col.slice(from * 3, from * 3 + 3), to * 3)
    regions[to] = reg[from]
  })
  return { count: total, positions, colors, regions }
}
