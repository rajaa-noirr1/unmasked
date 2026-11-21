// A backlit human silhouette drawn from joint angles (see data/poses.js), standing in a lit scene.
// The same pose can be placed in different scenes; that is the whole point of the context test.
import { useId, useMemo } from 'react'
import { POSES } from '../data/poses'

const rad = (d) => (d * Math.PI) / 180
// direction of a limb on side s (−1 = viewer's left, 1 = right); SVG y points down
const dir = (s, deg) => [s * Math.sin(rad(deg)), Math.cos(rad(deg))]

export function skeleton(pose = {}) {
  const sh = pose.shoulders || 0
  const sl = pose.slump || 0
  const head = pose.head || {}
  const shoulderY = -0.565 - 0.05 * sh + 0.035 * Math.max(0, sl)
  const shoulderX = 0.19 * (1 - 0.1 * Math.max(0, sl) + 0.06 * Math.max(0, -sl))
  const neckY = -0.625 + 0.03 * Math.max(0, sl)
  const headY = -0.8 + 0.085 * (head.drop || 0) - 0.03 * (head.lift || 0) + 0.025 * Math.max(0, sl)
  const out = { shoulderY, shoulderX, neckY, head: { x: 0, y: headY, tilt: head.tilt || 0, sy: 1 - 0.1 * (head.drop || 0) + 0.04 * (head.lift || 0) }, arms: [], legs: [] }
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) {
    const [ua, fa, layer] = pose[key] || [8, 4]
    const sx = s * shoulderX, sy = shoulderY + 0.01
    const d1 = dir(s, ua), elbow = [sx + d1[0] * 0.27, sy + d1[1] * 0.27]
    const d2 = dir(s, fa), wrist = [elbow[0] + d2[0] * 0.25, elbow[1] + d2[1] * 0.25]
    const hand = [wrist[0] + d2[0] * 0.045, wrist[1] + d2[1] * 0.045]
    out.arms.push({ s, shoulder: [sx, sy], elbow, wrist, hand, angle: fa, layer: layer || 'front' })
  }
  for (const [s, key] of [[-1, 'legL'], [1, 'legR']]) {
    const [ta, ca] = pose[key] || [3, 1]
    const hip = [s * 0.09, 0.03]
    const d1 = dir(s, ta), knee = [hip[0] + d1[0] * 0.46, hip[1] + d1[1] * 0.46]
    const d2 = dir(s, ca), ankle = [knee[0] + d2[0] * 0.43, knee[1] + d2[1] * 0.43]
    out.legs.push({ s, hip, knee, ankle })
  }
  return out
}

// A limb as a tapered capsule: width wa at a, wb at b, round at both ends.
function taper(a0, b, wa, wb, back = 0) {
  const len0 = Math.hypot(b[0] - a0[0], b[1] - a0[1]) || 1e-6
  // start a little inside the previous segment, so the two round ends never share an edge (no seams)
  const a = [a0[0] - ((b[0] - a0[0]) / len0) * back, a0[1] - ((b[1] - a0[1]) / len0) * back]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1e-6
  const nx = -dy / len, ny = dx / len
  const ra = wa / 2, rb = wb / 2
  const p = (q, n, r) => `${(q[0] + n[0] * r).toFixed(4)} ${(q[1] + n[1] * r).toFixed(4)}`
  return `M${p(a, [nx, ny], ra)} L${p(b, [nx, ny], rb)} A${rb} ${rb} 0 0 0 ${p(b, [-nx, -ny], rb)} L${p(a, [-nx, -ny], ra)} A${ra} ${ra} 0 0 0 ${p(a, [nx, ny], ra)} Z`
}

// The torso, sculpted: trapezius slope, deltoid, ribcage, waist, hip, into the thighs.
// The right half is drawn down to the crotch, then mirrored back up the left side.
function torsoOf(sx, sy, ny) {
  const P0 = [0.045, ny]
  const segs = [
    [[0.07, ny + 0.015], [sx - 0.07, sy - 0.035], [sx - 0.01, sy - 0.012]],
    [[sx + 0.035, sy], [sx + 0.04, sy + 0.06], [sx - 0.005, sy + 0.12]],
    [[0.15, -0.33], [0.135, -0.24], [0.118, -0.15]],
    [[0.112, -0.08], [0.158, -0.04], [0.158, 0.04]],
    [[0.158, 0.09], [0.12, 0.125], [0, 0.13]],
  ]
  const f = (p) => `${p[0].toFixed(4)} ${p[1].toFixed(4)}`
  const m = (p) => [-p[0], p[1]]
  let d = `M${f(P0)}`
  for (const [c1, c2, e] of segs) d += ` C${f(c1)} ${f(c2)} ${f(e)}`
  const starts = [P0, ...segs.map((s) => s[2])]
  for (let i = segs.length - 1; i >= 0; i--) d += ` C${f(m(segs[i][1]))} ${f(m(segs[i][0]))} ${f(m(starts[i]))}`
  return d + ' Z'
}

function Figure({ pose, x = 0, scale = 1, flip = false, tone = 'var(--sil)', rimFilter }) {
  const k = useMemo(() => skeleton(typeof pose === 'string' ? POSES[pose] : pose), [pose])
  const hands = (typeof pose === 'string' ? POSES[pose] : pose)?.hands || 'open'
  const sx = k.shoulderX, sy = k.shoulderY, ny = k.neckY
  const torsoPath = torsoOf(sx, sy, ny)
  const arm = (A) => (
    <g key={A.s}>
      <path d={taper(A.shoulder, A.elbow, 0.092, 0.066)} className="sil-solid" />
      <path d={taper(A.elbow, A.wrist, 0.068, 0.046, 0.018)} className="sil-solid" />
      <ellipse cx={A.hand[0]} cy={A.hand[1]} rx={hands === 'fist' ? 0.036 : hands === 'palm' ? 0.042 : 0.032} ry={hands === 'fist' ? 0.038 : 0.054}
        transform={`rotate(${-A.s * A.angle} ${A.hand[0]} ${A.hand[1]})`} className="sil-solid" />
    </g>
  )
  const shapes = (
    <>
      {k.arms.filter((a) => a.layer === 'back').map(arm)}
      {k.legs.map((L) => (
        <g key={L.s}>
          <path d={taper(L.hip, L.knee, 0.14, 0.082)} className="sil-solid" />
          <path d={taper(L.knee, L.ankle, 0.084, 0.05, 0.022)} className="sil-solid" />
          <ellipse cx={L.ankle[0] + L.s * 0.02} cy={L.ankle[1] + 0.03} rx="0.05" ry="0.024" className="sil-solid" />
        </g>
      ))}
      <path d={torsoPath} className="sil-solid" />
      <path d={taper([0, ny + 0.03], [0, k.head.y + 0.04], 0.068, 0.06)} className="sil-solid" />
      <ellipse cx={k.head.x} cy={k.head.y} rx="0.077" ry={0.1 * k.head.sy} transform={`rotate(${k.head.tilt} 0 ${ny})`} className="sil-solid" />
      {k.arms.filter((a) => a.layer !== 'back').map(arm)}
    </>
  )
  return (
    <g transform={`translate(${x} 0) scale(${flip ? -scale : scale} ${scale})`}>
      <g className="sil-body" stroke={tone} fill={tone} filter={rimFilter ? `url(#${rimFilter})` : undefined}>{shapes}{shapes}</g>
    </g>
  )
}

export const SCENES = {
  none: { light: '#f0c25a', tint: 0.5 },
  cold: { light: '#7fa2ff', tint: 0.7 },
  argument: { light: '#e2434f', tint: 0.75 },
  lecture: { light: '#dfe6f2', tint: 0.5 },
  stadium: { light: '#ffe8b0', tint: 0.8 },
  desk: { light: '#ffb45e', tint: 0.6 },
  protest: { light: '#ff7a3d', tint: 0.7 },
  win: { light: '#f0c25a', tint: 0.9 },
  room: { light: '#bfb2a7', tint: 0.4 },
}

/** pose: a key of POSES or a pose object. scene: a key of SCENES. */
export default function Silhouette({ pose = 'neutral', scene = 'none', className = '', label, animate = true, light }) {
  const id = useId().replace(/:/g, '')
  const base = SCENES[scene] || SCENES.none
  const sc = light ? { ...base, light } : base
  const snow = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ x: -0.9 + ((i * 37) % 100) / 55, d: 4 + (i % 7), delay: -((i * 13) % 40) / 4, r: 0.004 + (i % 3) * 0.003 })), [])
  return (
    <div className={`silhouette scene-${scene} ${animate ? 'is-animated' : ''} ${className}`} style={{ '--light': sc.light }}>
      <svg viewBox="-0.95 -1.34 1.9 2.46" role="img" aria-label={label || 'A silhouette of a person'} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id={`back-${id}`} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor={sc.light} stopOpacity={0.55 * sc.tint} />
            <stop offset="45%" stopColor={sc.light} stopOpacity={0.16 * sc.tint} />
            <stop offset="100%" stopColor={sc.light} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sc.light} stopOpacity={0.35 * sc.tint} />
            <stop offset="100%" stopColor={sc.light} stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.02" /></filter>
          <filter id={`rim-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feFlood floodColor={sc.light} result="c" />
            <feComposite in="c" in2="SourceAlpha" operator="in" result="lit" />
            <feOffset in="lit" dx="-0.006" dy="-0.009" result="off" />
            <feMerge><feMergeNode in="off" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="-0.95" y="-1.34" width="1.9" height="2.46" fill={`url(#back-${id})`} />
        {scene === 'lecture' && <path d="M-0.95 -1.34 L-0.2 -1.34 L0.55 1.1 L-0.95 1.1 Z" fill={`url(#beam-${id})`} opacity="0.7" />}
        {scene === 'stadium' && <>
          <path d="M-0.9 -1.34 L-0.75 -1.34 L0.2 1.1 L-0.3 1.1 Z" fill={`url(#beam-${id})`} />
          <path d="M0.9 -1.34 L0.75 -1.34 L-0.2 1.1 L0.3 1.1 Z" fill={`url(#beam-${id})`} />
        </>}
        {scene === 'desk' && <circle cx="0.55" cy="-0.35" r="0.6" fill={`url(#back-${id})`} />}
        <ellipse cx="0" cy="1.0" rx="0.42" ry="0.035" fill="#000" opacity="0.6" />
        <g filter={`url(#glow-${id})`} opacity="0.85"><Figure pose={pose} tone="var(--rim)" /></g>
        <Figure pose={pose} rimFilter={`rim-${id}`} />
        {scene === 'argument' && <g opacity="0.92"><Figure pose="fists" x={0.78} scale={1.02} flip rimFilter={`rim-${id}`} /></g>}
        {scene === 'protest' && <g opacity="0.75">
          <Figure pose="raisedFist" x={-0.62} scale={0.82} /><Figure pose="raisedFist" x={0.64} scale={0.86} flip />
        </g>}
        {scene === 'lecture' && <g opacity="0.95">{[-0.7, -0.35, 0.35, 0.7].map((x, i) => <ellipse key={i} cx={x} cy={0.92} rx="0.13" ry="0.17" fill="var(--sil)" />)}</g>}
        {scene === 'stadium' && <g opacity="0.95">{[-0.82, -0.55, -0.28, 0.28, 0.55, 0.82].map((x, i) => <ellipse key={i} cx={x} cy={0.95 - (i % 2) * 0.05} rx="0.12" ry="0.16" fill="var(--sil)" />)}</g>}
        {scene === 'desk' && <rect x="-0.95" y="0.25" width="1.9" height="0.9" fill="var(--sil)" />}
        {scene === 'cold' && <g className="snow">{snow.map((f, i) => <circle key={i} cx={f.x} cy="-1.3" r={f.r} style={{ animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }} />)}</g>}
        {scene === 'win' && <g className="confetti">{snow.slice(0, 26).map((f, i) => <rect key={i} x={f.x} y="-1.3" width="0.016" height="0.03" style={{ animationDuration: `${f.d * 0.8}s`, animationDelay: `${f.delay}s` }} />)}</g>}
      </svg>
    </div>
  )
}
