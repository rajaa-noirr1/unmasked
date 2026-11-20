// A human body made of light. Thousands of particles are sampled inside a figure built from simple
// shapes (an SDF), each tagged with the region it belongs to. The body breathes, drifts, parts around
// the cursor, and can be "heated" region by region: warm where an emotion is felt, cool where it fades.
import { useEffect, useRef } from 'react'
import { program, uniforms, fit, loop, lerp, clamp, prefersReducedMotion } from '../lib/gl'

export const REGIONS = ['head', 'throat', 'shoulders', 'chest', 'arms', 'hands', 'stomach', 'legs', 'feet']
const THICK = [1.1, 0.7, 0.9, 1.45, 0.62, 0.5, 1.3, 0.85, 0.5]

// The figure: [kind, region, ...params]. e = ellipse(cx, cy, rx, ry), c = capsule(ax, ay, bx, by, r)
const PRIMS = (() => {
  const P = [
    ['e', 0, 0, 0.8, 0.088, 0.112],
    ['c', 1, 0, 0.7, 0, 0.62, 0.043],
    ['c', 2, -0.19, 0.566, 0.19, 0.566, 0.052],
    ['e', 3, 0, 0.432, 0.166, 0.152],
    ['e', 6, 0, 0.215, 0.135, 0.138],
    ['e', 6, 0, 0.05, 0.156, 0.096],
  ]
  for (const s of [-1, 1]) {
    P.push(['c', 4, s * 0.216, 0.546, s * 0.274, 0.292, 0.047])
    P.push(['c', 4, s * 0.274, 0.292, s * 0.318, 0.052, 0.038])
    P.push(['e', 5, s * 0.333, -0.036, 0.037, 0.064])
    P.push(['c', 7, s * 0.086, 0.0, s * 0.1, -0.462, 0.073])
    P.push(['c', 7, s * 0.1, -0.462, s * 0.112, -0.9, 0.053])
    P.push(['e', 8, s * 0.124, -0.956, 0.053, 0.031])
  }
  return P
})()

function sdPrim(pr, x, y) {
  if (pr[0] === 'e') {
    const [, , cx, cy, rx, ry] = pr
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    return (Math.hypot(dx, dy) - 1) * Math.min(rx, ry)
  }
  const [, , ax, ay, bx, by, r] = pr
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1)
  return Math.hypot(pax - bax * h, pay - bay * h) - r
}
const smin = (a, b, k) => { const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h) }

// Distance to the whole body, and which region the point belongs to.
export function bodyAt(x, y) {
  let d = 9, best = 9, region = -1
  for (const pr of PRIMS) {
    const di = sdPrim(pr, x, y)
    d = smin(d, di, 0.035)
    if (di < best) { best = di; region = pr[1] }
  }
  return { d, region }
}

export const ANCHORS = {
  head: [0.11, 0.84], throat: [0.06, 0.66], shoulders: [0.24, 0.6], chest: [0.12, 0.45], arms: [0.31, 0.3],
  hands: [0.37, -0.03], stomach: [0.12, 0.2], legs: [0.17, -0.45], feet: [0.18, -0.95],
}

function makeParticles(count) {
  const pos = new Float32Array(count * 3)
  const meta = new Float32Array(count * 3)
  let n = 0, guard = 0
  while (n < count && guard < count * 60) {
    guard++
    const x = (Math.random() - 0.5) * 0.82
    const y = -1.0 + Math.random() * 1.95
    const { d, region } = bodyAt(x, y)
    const aura = d > 0 && d < 0.035 && Math.random() < 0.09
    if (d >= 0 && !aura) continue
    const edge = d > -0.014 ? 1 : 0
    if (!aura && !edge && Math.random() > 0.5) continue
    const z = (Math.random() - 0.5) * 0.15 * THICK[region] * (edge ? 0.55 : 1)
    pos.set([x, y, z], n * 3)
    meta.set([region, Math.random(), aura ? 2 : edge], n * 3)
    n++
  }
  return { pos: pos.subarray(0, n * 3), meta: meta.subarray(0, n * 3), n }
}

const VERT = `
attribute vec3 aPos;
attribute vec3 aMeta;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uScale;
uniform float uTime;
uniform float uRotY;
uniform float uRotX;
uniform vec2 uMouse;
uniform float uHeat[9];
uniform float uHover;
uniform float uSel;
uniform float uIntro;
uniform float uDpr;
varying vec3 vCol;
varying float vA;

void main(){
  int ri = int(aMeta.x + 0.5);
  float seed = aMeta.y;
  float kind = aMeta.z;           // 0 inside, 1 edge, 2 aura
  float h = uHeat[ri];
  vec3 p = aPos;

  // breathing (chest and belly) and a slow drift
  if (ri == 3 || ri == 6) { float b = sin(uTime * 1.25) * 0.016; p.x *= 1.0 + b; p.z *= 1.0 + b * 2.0; }
  if (ri == 2) p.y += sin(uTime * 1.25) * 0.004;
  p.xy += 0.0035 * vec2(sin(uTime * 0.7 + seed * 40.0), cos(uTime * 0.9 + seed * 31.0));
  // hot regions tremble a little
  p.xy += max(h, 0.0) * 0.004 * vec2(sin(uTime * 13.0 + seed * 90.0), cos(uTime * 11.0 + seed * 70.0));

  // the body gathers itself from scattered light
  float t = clamp(uIntro * 1.5 - seed * 0.5, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);
  float ang = seed * 6.2831 * 7.0;
  vec3 from = vec3(cos(ang), sin(ang), sin(ang * 1.7)) * (0.9 + seed * 1.6);
  p = mix(from, p, t);

  // the cursor parts the particles
  vec2 dm = p.xy - uMouse;
  float md = length(dm);
  p.xy += (dm / max(md, 1e-4)) * exp(-md * md / 0.006) * 0.045;

  // turn in 3D
  float cy = cos(uRotY), sy = sin(uRotY), cx = cos(uRotX), sx = sin(uRotX);
  vec3 r = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  r = vec3(r.x, r.y * cx - r.z * sx, r.y * sx + r.z * cx);
  float persp = 1.0 / (1.0 + r.z * 0.9);
  vec2 screen = uOrigin + r.xy * uScale * persp;
  gl_Position = vec4(screen / uRes * 2.0 - 1.0, 0.0, 1.0);

  // colour: bone at rest, arterial red → nerve gold when hot, venous blue when cool
  vec3 rest = vec3(0.92, 0.84, 0.76) * 0.78;
  vec3 warm = mix(vec3(0.89, 0.25, 0.30), vec3(1.0, 0.8, 0.42), clamp(h * 1.5 - 0.5, 0.0, 1.0));
  vec3 cool = vec3(0.32, 0.47, 0.98);
  vec3 col = h >= 0.0 ? mix(rest, warm, clamp(h, 0.0, 1.0)) : mix(rest, cool * 0.85, clamp(-h, 0.0, 1.0));
  float hovered = abs(float(ri) - uHover) < 0.5 ? 1.0 : 0.0;
  float selected = abs(float(ri) - uSel) < 0.5 ? 1.0 : 0.0;
  col = mix(col, vec3(1.0, 0.86, 0.55), hovered * 0.55);
  col *= 1.0 + hovered * 0.8 + selected * 0.6;
  if (uSel > -0.5 && selected < 0.5) col *= 0.42;
  float tw = 0.72 + 0.28 * sin(uTime * (1.5 + seed * 2.0) + seed * 60.0);
  vA = (kind > 1.5 ? 0.3 : kind > 0.5 ? 1.0 : 0.78) * tw * (0.35 + 0.65 * t);
  vCol = col;
  gl_PointSize = (kind > 1.5 ? 3.0 : kind > 0.5 ? 2.3 : 1.9) * (1.0 + max(h, 0.0) * 0.55 + hovered * 0.45) * uDpr * persp * (uScale / 380.0);
}
`
const FRAG = `
precision mediump float;
varying vec3 vCol;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.4) * vA;
  gl_FragColor = vec4(vCol * a, a);
}
`

/**
 * heat: { head: -3..3, ... } (missing regions = 0)
 * hover / selected: region names or null
 * onHover / onSelect: (regionName | null) => void
 * layout: (W, H) => { ox, oy, scale } in canvas pixels; default centres the figure
 */
export default function ParticleBody({ heat, hover = null, selected = null, onHover, onSelect, preview = false, layout, count, className = '', label }) {
  const canvasRef = useRef(null)
  const state = useRef({})
  state.current.heat = heat
  state.current.hover = hover
  state.current.selected = selected
  state.current.onHover = onHover
  state.current.onSelect = onSelect
  state.current.layout = layout

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true })
    if (!gl) return
    const reduce = prefersReducedMotion()
    const small = window.innerWidth < 760
    const { pos, meta, n } = makeParticles(count || (preview ? (small ? 2600 : 4200) : small ? 4500 : 8200))
    let prog
    try { prog = program(gl, VERT, FRAG) } catch (err) { console.warn('WebGL drawing unavailable:', err.message); return }
    gl.useProgram(prog)
    const bufP = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bufP)
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0)
    const bufM = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bufM)
    gl.bufferData(gl.ARRAY_BUFFER, meta, gl.STATIC_DRAW)
    const aMeta = gl.getAttribLocation(prog, 'aMeta')
    gl.enableVertexAttribArray(aMeta)
    gl.vertexAttribPointer(aMeta, 3, gl.FLOAT, false, 0, 0)
    const u = uniforms(gl, prog, ['uRes', 'uOrigin', 'uScale', 'uTime', 'uRotY', 'uRotX', 'uMouse', 'uHeat', 'uHover', 'uSel', 'uIntro', 'uDpr'])
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.clearColor(0, 0, 0, 0)

    const s = { mouse: [9, 9], rot: [0, 0], rotT: [0, 0], heat: new Float32Array(9), born: -1, hoverName: null, frame: null, inside: false }

    const toFigure = (e) => {
      const r = canvas.getBoundingClientRect()
      if (!s.frame) return null
      const dpr = canvas.width / Math.max(1, r.width)
      const px = (e.clientX - r.left) * dpr, py = (r.height - (e.clientY - r.top)) * dpr
      return [(px - s.frame.ox) / s.frame.scale, (py - s.frame.oy) / s.frame.scale, (e.clientX - r.left) / r.width - 0.5]
    }
    const move = (e) => {
      const f = toFigure(e)
      if (!f) return
      s.mouse = [f[0], f[1]]
      s.rotT = [f[2] * 0.55, 0]
      if (preview) return
      const { d, region } = bodyAt(f[0], f[1])
      const name = d < 0.03 ? REGIONS[region] : null
      if (name !== s.hoverName) { s.hoverName = name; state.current.onHover?.(name) }
      canvas.style.cursor = name ? 'pointer' : ''
    }
    const leave = () => { s.mouse = [9, 9]; s.rotT = [0, 0]; if (s.hoverName) { s.hoverName = null; state.current.onHover?.(null) } }
    const click = (e) => {
      if (preview) return
      const f = toFigure(e)
      if (!f) return
      const { d, region } = bodyAt(f[0], f[1])
      state.current.onSelect?.(d < 0.03 ? REGIONS[region] : null)
    }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerleave', leave)
    canvas.addEventListener('click', click)

    const stop = loop(canvas, (time) => {
      fit(canvas, 1.75)
      const W = canvas.width, H = canvas.height
      gl.viewport(0, 0, W, H)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (s.born < 0) s.born = time
      const fr = (state.current.layout || ((w, h) => ({ ox: w / 2, oy: h * 0.5, scale: h * 0.45 })))(W, H)
      s.frame = fr
      // ease the heat map toward its target
      const target = state.current.heat || {}
      for (let i = 0; i < 9; i++) s.heat[i] = lerp(s.heat[i], clamp((target[REGIONS[i]] || 0) / 3, -1, 1), 0.06)
      const auto = preview && !reduce ? Math.sin(time * 0.35) * 0.35 : 0
      s.rot = [lerp(s.rot[0], s.rotT[0] + auto, 0.05), lerp(s.rot[1], s.rotT[1], 0.05)]
      const hv = REGIONS.indexOf(state.current.hover ?? s.hoverName)
      const sl = REGIONS.indexOf(state.current.selected)

      gl.uniform2f(u.uRes, W, H)
      gl.uniform2f(u.uOrigin, fr.ox, fr.oy)
      gl.uniform1f(u.uScale, fr.scale)
      gl.uniform1f(u.uTime, reduce ? 0 : time)
      gl.uniform1f(u.uRotY, s.rot[0])
      gl.uniform1f(u.uRotX, s.rot[1])
      gl.uniform2f(u.uMouse, s.mouse[0], s.mouse[1])
      gl.uniform1fv(u.uHeat, s.heat)
      gl.uniform1f(u.uHover, hv)
      gl.uniform1f(u.uSel, sl)
      gl.uniform1f(u.uIntro, reduce ? 1 : clamp((time - s.born) / 2.6, 0, 1))
      gl.uniform1f(u.uDpr, Math.min(window.devicePixelRatio || 1, 1.75))
      gl.drawArrays(gl.POINTS, 0, n)
    })

    return () => {
      stop()
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('click', click)
    }
  }, [preview, count])

  return <canvas ref={canvasRef} className={`particle-body ${className}`} role="img" aria-label={label || 'A human body drawn in points of light'} />
}
