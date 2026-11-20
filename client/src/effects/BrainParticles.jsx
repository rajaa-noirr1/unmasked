// Adapted from Particles by React Bits (https://reactbits.dev), MIT + Commons Clause, (c) David Haz.
// See THIRD-PARTY-NOTICES.md. Kept: instanced glowing points, twinkle, glow halos, constellation
// lines, cursor repel and click shockwaves. Changed for Unmasked: the points come from a given
// shape (a brain) instead of a random sphere; impulses spread across the surface like neurons
// firing; the region under the cursor lights up; the camera holds a slow three-quarter view.
import { useEffect, useRef } from 'react'
import { attention } from '../lib/attention'

const MAX_LINKED = 1100
const MAX_LINES = 9000
const MAX_BURSTS = 4
const MAX_PULSES = 8
const FOCAL = 1 / Math.tan((7.5 * Math.PI) / 180)
const INTRO_SECONDS = 2.6
const BURST_SECONDS = 1.5
const BURST_SPEED = 520
const BURST_WIDTH = 46
const PULSE_SPEED = 0.62
const PULSE_LIFE = 3.4

const DOT_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aPosition;
layout(location = 2) in vec4 aRandom;
layout(location = 3) in vec3 aColor;
layout(location = 4) in float aRegion;
uniform mat3 uRotation;
uniform vec3 uOffset;
uniform float uTime;
uniform float uCamera;
uniform float uAspect;
uniform vec2 uView;
uniform float uRatio;
uniform float uSize;
uniform float uGlow;
uniform float uTwinkle;
uniform vec4 uPointer;
uniform float uStrength;
uniform vec4 uBursts[${MAX_BURSTS}];
uniform int uBurstCount;
uniform float uReveal;
uniform vec4 uPulses[${MAX_PULSES}];
uniform vec3 uFire;
uniform float uRegion;
uniform float uHighlight;
uniform vec3 uHighlightColor;
uniform float uDensity;
out vec2 vLocal;
out float vRadius;
out float vAlpha;
out float vHalo;
out float vSeed;
out vec3 vColor;

vec3 bob(vec4 r, float t) {
  return vec3(sin(t * r.z + 6.28 * r.w) * mix(0.1, 1.5, r.x), sin(t * r.y + 6.28 * r.x) * mix(0.1, 1.5, r.w), sin(t * r.w + 6.28 * r.y) * mix(0.1, 1.5, r.z));
}

void main() {
  vec3 pos = aPosition;
  float act = 0.0;
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 p = uPulses[i];
    if (p.w < 0.0) continue;
    float d = distance(pos, p.xyz);
    float ring = exp(-pow((d - p.w * ${PULSE_SPEED.toFixed(3)}) / 0.07, 2.0)) * exp(-p.w * 1.05);
    float spark = exp(-pow(d / 0.07, 2.0)) * exp(-p.w * 5.0);
    act += ring + spark;
  }
  act = clamp(act, 0.0, 1.4);
  float hl = abs(aRegion - uRegion) < 0.5 ? uHighlight : 0.0;

  vec3 world = uRotation * pos + uOffset + bob(aRandom, uTime) * 0.006;
  vec3 view = world - vec3(0.0, 0.0, uCamera);
  float dist = length(view);
  float ahead = -view.z;
  if (ahead < 0.1) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 ndc = vec2(view.x * ${FOCAL.toFixed(6)} / uAspect, view.y * ${FOCAL.toFixed(6)}) / ahead;
  vec2 screen = (ndc * 0.5 + 0.5) * uView;

  vec2 shift = vec2(0.0);
  float flash = 0.0;
  if (uPointer.z > 0.001) {
    vec2 delta = screen - uPointer.xy;
    float reach = length(delta);
    float falloff = exp(-dot(delta, delta) / (uPointer.w * uPointer.w));
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    shift += away * uPointer.w * 0.5 * falloff * uStrength * uPointer.z;
  }
  for (int i = 0; i < ${MAX_BURSTS}; i++) {
    if (i >= uBurstCount) break;
    vec4 burst = uBursts[i];
    vec2 delta = screen - burst.xy;
    float reach = length(delta);
    float wave = exp(-pow((reach - burst.z * ${BURST_SPEED.toFixed(1)}) / ${BURST_WIDTH.toFixed(1)}, 2.0));
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    float fade = (1.0 - burst.z) * (1.0 - burst.z) * burst.w;
    shift += away * wave * fade * 56.0 * smoothstep(0.0, 30.0, reach);
    flash += wave * fade;
  }
  screen += shift;

  float diameter = uSize * (0.75 + 0.5 * aRandom.x) / dist * (1.0 + min(flash, 1.0) * 0.6 + act * 1.1 + hl * 0.3);
  float radius = max(diameter, 1.0 / uRatio) * 0.5;
  float halo = uGlow > 0.0 ? radius * 2.5 + 2.0 : 0.0;
  float extent = radius + halo + 1.5;
  float twinkle = 1.0 - uTwinkle * 0.6 * (0.5 + 0.5 * sin(uTime * (6.0 + aRandom.y * 14.0) + aRandom.w * 40.0));
  float front = clamp((uCamera + 1.0 - ahead) / 2.0, 0.0, 1.0);
  float depth = mix(0.07, 1.0, front * front);
  float reveal = clamp(uReveal * 1.6 - aRandom.z * 0.6, 0.0, 1.0);

  vLocal = aCorner * extent;
  vRadius = radius;
  vHalo = halo;
  vSeed = aRandom.y;
  vAlpha = uDensity * twinkle * depth * (1.0 + flash * 0.9 + act * 1.4 + hl * 0.45) * reveal * reveal;
  vColor = mix(mix(aColor, uHighlightColor, hl * 0.6), uFire, clamp(act, 0.0, 1.0));
  gl_Position = vec4((screen + aCorner * extent) / uView * 2.0 - 1.0, 0.0, 1.0);
}`

const DOT_FRAGMENT = `#version 300 es
precision highp float;
uniform float uGlow;
uniform float uRatio;
in vec2 vLocal;
in float vRadius;
in float vAlpha;
in float vHalo;
in float vSeed;
in vec3 vColor;
out vec4 outColor;
void main() {
  float soft = 0.7 / uRatio;
  float d = length(vLocal);
  float shape = 1.0 - smoothstep(vRadius - soft, vRadius + soft, d);
  float halo = vHalo > 0.0 ? exp(-d / (vHalo * 0.35)) * uGlow * 0.4 : 0.0;
  float alpha = clamp(shape + halo * (1.0 - shape), 0.0, 1.0) * min(vAlpha, 1.6);
  if (alpha < 0.002) discard;
  outColor = vec4(vColor * alpha, alpha);
}`

const LINE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aEnds;
layout(location = 2) in vec4 aTint;
uniform vec2 uView;
uniform float uRatio;
uniform float uWidth;
out float vAcross;
out float vHalf;
out vec4 vTint;
void main() {
  vec2 a = aEnds.xy;
  vec2 b = aEnds.zw;
  vec2 along = b - a;
  float span = max(length(along), 0.0001);
  vec2 normal = vec2(-along.y, along.x) / span;
  float reach = uWidth * 0.5 + 1.0 / uRatio;
  vec2 point = mix(a, b, aCorner.x * 0.5 + 0.5) + normal * aCorner.y * reach;
  vAcross = aCorner.y * reach;
  vHalf = uWidth * 0.5;
  vTint = aTint;
  gl_Position = vec4(point / uView * 2.0 - 1.0, 0.0, 1.0);
}`

const LINE_FRAGMENT = `#version 300 es
precision highp float;
uniform float uRatio;
in float vAcross;
in float vHalf;
in vec4 vTint;
out vec4 outColor;
void main() {
  float edge = 0.6 / uRatio;
  float cover = 1.0 - smoothstep(vHalf - edge, vHalf + edge, abs(vAcross));
  float alpha = cover * vTint.a;
  outColor = vec4(vTint.rgb * alpha, alpha);
}`

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }

function compile(gl, type, source) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, source)
  gl.compileShader(sh)
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh
  console.warn(gl.getShaderInfoLog(sh))
  gl.deleteShader(sh)
  return null
}
function link(gl, vs, fs) {
  const v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs)
  if (!v || !f) return null
  const program = gl.createProgram()
  gl.attachShader(program, v); gl.attachShader(program, f); gl.linkProgram(program)
  gl.deleteShader(v); gl.deleteShader(f)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null }
  const uniforms = {}
  const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(program, i); if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name) }
  return { program, uniforms }
}

/**
 * cloud: { count, positions, colors, regions } in brain units (about -1..1)
 * onPick(region | null): the region under the cursor changed
 */
export default function BrainParticles({
  cloud, size = 30, glow = 0.55, twinkle = 0.25, density = 0.55, camera = 8.2,
  connections = true, connectionDistance = 34, hoverRadius = 70, hoverStrength = 0.45,
  fireColor = '#f0c25a', highlightColor = '#ffd98a', lineColor = '#c9b8ff',
  yaw = -1.15, pitch = 0.3, onPick, className = '', style,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const settings = { cloud, size, glow, twinkle, density, camera, connections, connectionDistance, hoverRadius, hoverStrength, fire: hex(fireColor), high: hex(highlightColor), line: hex(lineColor), yaw, pitch, onPick }
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
    if (!container || !canvas || !gl) return undefined
    const dots = link(gl, DOT_VERTEX, DOT_FRAGMENT)
    const lines = link(gl, LINE_VERTEX, LINE_FRAGMENT)
    if (!dots || !lines) return undefined

    const corners = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const buffers = { position: gl.createBuffer(), random: gl.createBuffer(), color: gl.createBuffer(), region: gl.createBuffer() }
    const dotVao = gl.createVertexArray()
    gl.bindVertexArray(dotVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const attach = (buffer, loc, width) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, width, gl.FLOAT, false, 0, 0)
      gl.vertexAttribDivisor(loc, 1)
    }
    attach(buffers.position, 1, 3); attach(buffers.random, 2, 4); attach(buffers.color, 3, 3); attach(buffers.region, 4, 1)

    const lineBuffer = gl.createBuffer()
    const lineData = new Float32Array(MAX_LINES * 8)
    const lineVao = gl.createVertexArray()
    gl.bindVertexArray(lineVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, lineData.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16)
    gl.vertexAttribDivisor(2, 1)
    gl.bindVertexArray(null)

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const view = { width: 1, height: 1, ratio: 1 }
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, nx: 0, ny: 0, inside: false, active: 0, moved: false }
    // region: the lobe that is lit (it stays set while the light fades); picked: the lobe the readout names;
    // cand: what is under the cursor now, which must hold for a moment before it is picked (no flicker at borders)
    const state = { clock: 0, reveal: reduce ? 1 : 0, yaw: settingsRef.current.yaw, pitch: settingsRef.current.pitch, highlight: 0, region: -1, picked: -1, cand: -1, candSince: 0, near: -1, nextPulse: 0.4, lastStim: 0 }
    const bursts = []
    const packedBursts = new Float32Array(MAX_BURSTS * 4)
    const pulses = []
    const packedPulses = new Float32Array(MAX_PULSES * 4)
    let data = null
    let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    let raf = 0, last = 0, visible = true
    const screen = { x: new Float32Array(MAX_LINKED), y: new Float32Array(MAX_LINKED), alpha: new Float32Array(MAX_LINKED), act: new Float32Array(MAX_LINKED) }

    const upload = (c) => {
      data = c
      const randoms = new Float32Array(c.count * 4)
      for (let i = 0; i < randoms.length; i++) randoms[i] = Math.random()
      data.randoms = randoms
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); gl.bufferData(gl.ARRAY_BUFFER, c.positions, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.random); gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color); gl.bufferData(gl.ARRAY_BUFFER, c.colors, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.region); gl.bufferData(gl.ARRAY_BUFFER, c.regions, gl.STATIC_DRAW)
    }

    const rotation = (yaw, pitch) => {
      const c = Math.cos(yaw), s = Math.sin(yaw), cb = Math.cos(pitch), sb = Math.sin(pitch)
      return [c, sb * s, -cb * s, 0, cb, sb, s, -sb * c, cb * c] // column-major Rx(pitch)·Ry(yaw)
    }
    const offsetZ = () => -(1 - easeOut(state.reveal)) * 22

    // where point i lands on screen (pixels, origin bottom-left)
    const toScreen = (i, out) => {
      const p = data.positions, m = matrix
      const px = p[i * 3], py = p[i * 3 + 1], pz = p[i * 3 + 2]
      const wx = m[0] * px + m[3] * py + m[6] * pz
      const wy = m[1] * px + m[4] * py + m[7] * pz
      const wz = m[2] * px + m[5] * py + m[8] * pz + offsetZ()
      const ahead = settingsRef.current.camera - wz
      out[0] = ((wx * FOCAL) / (view.width / view.height) / ahead) * 0.5 * view.width + view.width / 2
      out[1] = ((wy * FOCAL) / ahead) * 0.5 * view.height + view.height / 2
      out[2] = ahead
      return out
    }

    const activityAt = (i) => {
      const p = data.positions
      let a = 0
      for (const q of pulses) {
        const d = Math.hypot(p[i * 3] - q.x, p[i * 3 + 1] - q.y, p[i * 3 + 2] - q.z)
        a += Math.exp(-(((d - q.age * PULSE_SPEED) / 0.07) ** 2)) * Math.exp(-q.age * 1.05) + Math.exp(-((d / 0.07) ** 2)) * Math.exp(-q.age * 5)
      }
      return Math.min(1.4, a)
    }

    const fire = (i) => {
      if (!data) return
      const p = data.positions
      pulses.push({ x: p[i * 3], y: p[i * 3 + 1], z: p[i * 3 + 2], age: 0 })
      if (pulses.length > MAX_PULSES) pulses.shift()
    }

    // what is under the cursor, among the nearer half of the brain: the nearest point, and the region most
    // of the nearby points belong to (a vote, so the border between two lobes does not flicker)
    const tmp = [0, 0, 0]
    const votes = new Float32Array(8)
    const pick = () => {
      if (!data || !pointer.inside) return { i: -1, region: -1 }
      const R = 26
      let best = -1, bestD = R * R
      votes.fill(0)
      const step = data.count > 8000 ? 2 : 1
      for (let i = 0; i < data.count; i += step) {
        toScreen(i, tmp)
        if (tmp[2] > settingsRef.current.camera + 0.15) continue
        const dx = tmp[0] - pointer.x, dy = tmp[1] - pointer.y, d = dx * dx + dy * dy
        if (d >= R * R) continue
        votes[data.regions[i]] += 1 - Math.sqrt(d) / R
        if (d < bestD) { bestD = d; best = i }
      }
      if (best < 0) return { i: -1, region: -1 }
      let region = 0
      for (let r = 1; r < votes.length; r++) if (votes[r] > votes[region]) region = r
      return { i: best, region }
    }

    const buildLines = (s) => {
      const total = Math.min(data.count, MAX_LINKED)
      for (let i = 0; i < total; i++) {
        toScreen(i, tmp)
        const front = clamp((s.camera + 1 - tmp[2]) / 2, 0, 1)
        screen.x[i] = tmp[0]; screen.y[i] = tmp[1]
        screen.alpha[i] = (0.15 + 0.85 * front * front) * easeOut(state.reveal)
        screen.act[i] = pulses.length ? activityAt(i) : 0
      }
      const reach = s.connectionDistance, limit = reach * reach
      const cols = Math.max(1, Math.ceil(view.width / reach) + 2)
      const buckets = new Map()
      for (let i = 0; i < total; i++) {
        const key = (Math.floor(screen.y[i] / reach) + 1) * cols + Math.floor(screen.x[i] / reach) + 1
        const b = buckets.get(key)
        if (b) b.push(i); else buckets.set(key, [i])
      }
      let n = 0
      for (const [key, members] of buckets) {
        for (const off of [0, 1, cols - 1, cols, cols + 1]) {
          const others = off === 0 ? members : buckets.get(key + off)
          if (!others) continue
          for (let a = 0; a < members.length; a++) {
            const i = members[a]
            for (let b = off === 0 ? a + 1 : 0; b < others.length; b++) {
              const j = others[b]
              const dx = screen.x[i] - screen.x[j], dy = screen.y[i] - screen.y[j], gap = dx * dx + dy * dy
              if (gap > limit) continue
              if (n >= MAX_LINES) return n
              const fade = 1 - Math.sqrt(gap) / reach
              const act = Math.min(1, (screen.act[i] + screen.act[j]) * 0.5)
              const k = n * 8
              lineData[k] = screen.x[i]; lineData[k + 1] = screen.y[i]; lineData[k + 2] = screen.x[j]; lineData[k + 3] = screen.y[j]
              lineData[k + 4] = s.line[0] + (s.fire[0] - s.line[0]) * act
              lineData[k + 5] = s.line[1] + (s.fire[1] - s.line[1]) * act
              lineData[k + 6] = s.line[2] + (s.fire[2] - s.line[2]) * act
              lineData[k + 7] = fade * fade * Math.min(screen.alpha[i], screen.alpha[j]) * (0.1 + act * 0.85)
              n++
            }
          }
        }
      }
      return n
    }

    const render = () => {
      const s = settingsRef.current
      if (s.cloud !== data && s.cloud) upload(s.cloud)
      if (!data) return
      matrix = rotation(state.yaw, state.pitch)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)

      if (s.connections) {
        const n = buildLines(s)
        if (n) {
          gl.useProgram(lines.program)
          gl.bindVertexArray(lineVao)
          gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, lineData.subarray(0, n * 8))
          gl.uniform2f(lines.uniforms.uView, view.width, view.height)
          gl.uniform1f(lines.uniforms.uRatio, view.ratio)
          gl.uniform1f(lines.uniforms.uWidth, 1)
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n)
        }
      }

      let bc = 0
      for (let i = bursts.length - 1; i >= 0 && bc < MAX_BURSTS; i--) { packedBursts.set([bursts[i].x, bursts[i].y, bursts[i].age / BURST_SECONDS, 1], bc * 4); bc++ }
      for (let i = 0; i < MAX_PULSES; i++) {
        const q = pulses[i]
        packedPulses.set(q ? [q.x, q.y, q.z, q.age] : [0, 0, 0, -1], i * 4)
      }
      const u = dots.uniforms
      gl.useProgram(dots.program)
      gl.bindVertexArray(dotVao)
      gl.uniformMatrix3fv(u.uRotation, false, matrix)
      gl.uniform3f(u.uOffset, 0, 0, offsetZ())
      gl.uniform1f(u.uTime, state.clock)
      gl.uniform1f(u.uCamera, s.camera)
      gl.uniform1f(u.uAspect, view.width / view.height)
      gl.uniform2f(u.uView, view.width, view.height)
      gl.uniform1f(u.uRatio, view.ratio)
      gl.uniform1f(u.uSize, s.size)
      gl.uniform1f(u.uGlow, s.glow)
      gl.uniform1f(u.uTwinkle, s.twinkle)
      gl.uniform4f(u.uPointer, pointer.sx, pointer.sy, pointer.active, s.hoverRadius)
      gl.uniform1f(u.uStrength, s.hoverStrength)
      gl.uniform4fv(u.uBursts, packedBursts)
      gl.uniform1i(u.uBurstCount, bc)
      gl.uniform1f(u.uReveal, state.reveal)
      gl.uniform4fv(u.uPulses, packedPulses)
      gl.uniform3fv(u.uFire, s.fire)
      gl.uniform1f(u.uRegion, state.region)
      gl.uniform1f(u.uHighlight, state.highlight)
      gl.uniform3fv(u.uHighlightColor, s.high)
      gl.uniform1f(u.uDensity, s.density)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, data.count)
      gl.bindVertexArray(null)
    }

    const frame = (now) => {
      raf = 0
      if (!visible || document.hidden) return
      const s = settingsRef.current
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60
      last = now
      state.clock += dt
      const engaged = pointer.inside && !reduce
      // the slow three-quarter turn, leaning toward the cursor
      const swing = reduce ? 0 : Math.sin(state.clock * 0.16) * 0.38
      const yawGoal = s.yaw + swing + (engaged ? pointer.nx * 0.3 : 0)
      const pitchGoal = s.pitch + (engaged ? -pointer.ny * 0.16 : 0)
      const follow = 1 - Math.exp(-dt / 0.6)
      state.yaw += (yawGoal - state.yaw) * follow
      state.pitch += (pitchGoal - state.pitch) * follow
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt / 0.06))
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt / 0.06))
      pointer.active += ((engaged ? 1 : 0) - pointer.active) * (1 - Math.exp(-dt / 0.2))
      for (let i = bursts.length - 1; i >= 0; i--) { bursts[i].age += dt; if (bursts[i].age >= BURST_SECONDS) bursts.splice(i, 1) }
      for (let i = pulses.length - 1; i >= 0; i--) { pulses[i].age += dt; if (pulses[i].age > PULSE_LIFE) pulses.splice(i, 1) }
      // the brain fires on its own; paying attention (a link or button under the cursor) makes it fire faster
      state.nextPulse -= dt * (1 + attention() * 3)
      if (data && state.nextPulse <= 0 && state.reveal > 0.5) { fire(Math.floor(Math.random() * data.count)); state.nextPulse = 0.5 + Math.random() * 0.9 }
      // the region under the cursor
      if (pointer.moved && data && state.reveal > 0.8) {
        pointer.moved = false
        const found = pick()
        state.near = found.i
        if (found.region !== state.cand) { state.cand = found.region; state.candSince = now }
        if (found.i >= 0 && state.clock - state.lastStim > 0.6) { fire(found.i); state.lastStim = state.clock }
      }
      // a new lobe is named once the cursor has stayed on it briefly; leaving the brain waits a little longer
      if (data && state.cand !== state.picked && now - state.candSince > (state.cand < 0 ? 300 : 90)) { // real time, not frames
        state.picked = state.cand
        if (state.picked >= 0) state.region = state.picked
        s.onPick?.(state.picked >= 0 ? state.picked : null)
      }
      state.hovering = state.picked >= 0
      state.highlight += ((state.hovering ? 1 : 0) - state.highlight) * (1 - Math.exp(-dt / 0.25))
      // the intro runs on the wall clock, so a slow device still sees the brain arrive on time
      if (state.reveal < 1) state.reveal = Math.min(1, state.reveal + Math.min(0.5, (now - (state.prev || now)) / 1000) / INTRO_SECONDS)
      state.prev = now
      render()
      raf = requestAnimationFrame(frame)
    }
    const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame) }

    const resize = () => {
      const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight)
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
      view.width = w; view.height = h
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio)
      view.ratio = canvas.width / w
      render()
      wake()
    }
    const lastClient = { x: -1e5, y: -1e5 }
    const locate = (e) => {
      lastClient.x = e.clientX; lastClient.y = e.clientY
      const r = container.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      const was = pointer.inside
      pointer.inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height
      pointer.x = x; pointer.y = r.height - y
      pointer.nx = (x / Math.max(1, r.width)) * 2 - 1
      pointer.ny = -((y / Math.max(1, r.height)) * 2 - 1)
      if (pointer.inside && !was) { pointer.sx = pointer.x; pointer.sy = pointer.y }
      pointer.moved = true
    }
    const onMove = (e) => { locate(e); wake() }
    const onDown = (e) => {
      locate(e)
      if (!pointer.inside || reduce) return
      bursts.push({ x: pointer.x, y: pointer.y, age: 0 })
      if (bursts.length > MAX_BURSTS) bursts.shift()
      const { i } = pick()
      if (i >= 0) { fire(i); fire(i) }
    }
    const onLeave = () => { pointer.inside = false; pointer.moved = true; lastClient.x = lastClient.y = -1e5 }
    const onScroll = () => { locate({ clientX: lastClient.x, clientY: lastClient.y }); wake() }
    const onVisibility = () => { last = 0; wake() }

    const ro = new ResizeObserver(resize)
    ro.observe(container)
    const io = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); if (visible) { last = 0; wake() } })
    io.observe(container)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    resize()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteProgram(dots.program); gl.deleteProgram(lines.program)
      ;[corners, lineBuffer, ...Object.values(buffers)].forEach((b) => gl.deleteBuffer(b))
      gl.deleteVertexArray(dotVao); gl.deleteVertexArray(lineVao)
    }
  }, [])

  return (
    <div ref={containerRef} className={`brain-particles ${className}`} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
