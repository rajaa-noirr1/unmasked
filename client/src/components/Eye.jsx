// The hero: one human eye in the dark, drawn entirely by a fragment shader.
// It follows the cursor (with the small idle jumps real eyes make), blinks on its own, opens slowly on
// arrival, and its pupil does what pupils do: it widens with interest (pointing at a link or button)
// and narrows when light comes close (the cursor is the light).
import { useEffect, useRef, useState } from 'react'
import { program, uniforms, fit, loop, lerp, clamp, prefersReducedMotion } from '../lib/gl'
import { onAttention } from '../lib/attention'

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;
uniform float uSize;
uniform vec2 uLook;
uniform float uPupil;
uniform float uBlink;
uniform float uOpen;
uniform vec2 uMouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; }
  return v;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - uCenter) / uSize;
  float aa = 2.5 / uSize;

  // ── the opening between the lids ──
  float x = clamp(p.x, -1.0, 1.0);
  float shape = max(0.0, 1.0 - x * x);
  float open = clamp(uOpen * (1.0 - uBlink), 0.0, 1.0);
  float upperOpen = 0.54 * pow(shape, 0.72) + 0.03 * shape * (p.x + 0.4);
  float lowerOpen = -0.33 * pow(shape, 0.95) - 0.02 * shape * (p.x - 0.2);
  float meet = lowerOpen * 0.45 + 0.01;
  float upperY = mix(meet, upperOpen, open);
  float lowerY = mix(meet - 0.004, lowerOpen, clamp(open * 1.8, 0.0, 1.0));
  float inEye = smoothstep(-aa, aa, upperY - p.y) * smoothstep(-aa, aa, p.y - lowerY) * (1.0 - smoothstep(0.98, 1.0, abs(p.x)));

  // ── iris ──
  vec2 gaze = uLook * vec2(0.34, 0.13);
  vec2 ip = p - gaze;
  float R = 0.405;
  float r = length(ip) / R;
  float a = atan(ip.y, ip.x);
  float pupilR = mix(0.24, 0.56, uPupil);
  float t = smoothstep(pupilR, 1.0, r);

  float fib = fbm(vec2(a * 9.0, r * 2.4 - uTime * 0.012));
  float streak = noise(vec2(a * 74.0, r * 3.2));
  float crypt = smoothstep(0.56, 0.78, fbm(vec2(a * 5.0 + 3.1, r * 6.5)));

  vec3 gold = vec3(0.96, 0.70, 0.27);
  vec3 hazel = vec3(0.47, 0.40, 0.20);
  vec3 venous = vec3(0.24, 0.35, 0.62);
  vec3 iris = mix(gold, hazel, smoothstep(0.0, 0.42, t));
  iris = mix(iris, venous, smoothstep(0.38, 0.96, t));
  iris *= 0.5 + 0.85 * fib;
  iris += streak * 0.16 * vec3(1.0, 0.86, 0.6) * (1.0 - t);
  iris *= 1.0 - crypt * 0.5 * smoothstep(0.15, 0.8, t);
  float collar = pupilR + (1.0 - pupilR) * 0.3 + 0.035 * (noise(vec2(a * 7.0, 2.0)) - 0.5);
  iris += vec3(1.0, 0.74, 0.32) * 0.4 * smoothstep(0.065, 0.0, abs(r - collar));
  iris *= mix(1.0, 0.12, smoothstep(0.8, 1.0, r));
  // a faint inner glow around the pupil, as if lit from behind
  iris += vec3(0.95, 0.6, 0.22) * 0.18 * smoothstep(pupilR + 0.25, pupilR, r);
  float pupil = smoothstep(pupilR + 0.012, pupilR - 0.012, r);
  vec3 irisCol = mix(iris, vec3(0.006, 0.004, 0.005), pupil);
  float irisMask = smoothstep(1.0 + aa / R, 1.0 - aa / R, r);

  // ── sclera ──
  vec3 sclera = vec3(0.79, 0.73, 0.69) * (0.5 + 0.28 * (1.0 - abs(p.x)));
  float vein = 1.0 - abs(noise(p * 9.0 + 4.0) * 2.0 - 1.0);
  vein = pow(vein, 16.0) * smoothstep(0.3, 1.0, abs(p.x));
  sclera = mix(sclera, vec3(0.62, 0.14, 0.17), vein * 0.6);
  float lidShade = smoothstep(0.0, 0.24, upperY - p.y);
  sclera *= mix(0.32, 1.0, lidShade);
  sclera *= mix(0.5, 1.0, smoothstep(1.0, 0.62, abs(p.x)));
  vec3 eye = mix(sclera, irisCol, irisMask);
  eye *= mix(0.42, 1.0, lidShade);
  // wet highlights (a window, and a small second light)
  float spec = smoothstep(0.08, 0.0, length((ip - vec2(-0.14, 0.15)) * vec2(1.0, 1.35)));
  float spec2 = smoothstep(0.032, 0.0, length(ip - vec2(0.13, -0.12)));
  eye += vec3(1.0, 0.95, 0.88) * (spec * 0.8 + spec2 * 0.32);
  eye += vec3(1.0, 0.92, 0.85) * 0.12 * smoothstep(0.03, 0.0, abs(p.y - lowerY - 0.012)) * shape;

  // ── skin in the dark around it ──
  vec2 q = p * vec2(0.52, 1.0);
  float lit = exp(-dot(q, q) * 1.5);
  vec3 skin = vec3(0.17, 0.09, 0.08) * lit * (0.72 + 0.56 * fbm(p * 5.0 + 9.0));
  float creaseY = upperY + 0.2 * shape + 0.07;
  skin *= 1.0 - 0.6 * smoothstep(0.06, 0.0, abs(p.y - creaseY)) * shape;
  skin *= 1.0 - 0.35 * smoothstep(0.1, 0.0, abs(p.y - (lowerY - 0.16 * shape - 0.05))) * shape;
  float lash = smoothstep(0.075, 0.0, abs(p.y - upperY)) * (1.0 - smoothstep(0.97, 1.08, abs(p.x)));

  vec3 col = mix(skin, eye, inEye);
  col = mix(col, vec3(0.012, 0.006, 0.007), lash * 0.88);

  // the cursor is a light: a warm wash where it points
  float ml = exp(-length((frag - uMouse) / uRes.y) * 5.0);
  col += vec3(0.95, 0.72, 0.42) * ml * 0.045;
  col = max(col, vec3(0.043, 0.031, 0.035));
  float vig = smoothstep(1.4, 0.2, length((frag / uRes - 0.5) * vec2(1.2, 1.0)));
  col *= mix(0.72, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`

export default function Eye({ className = '', placement }) {
  const canvasRef = useRef(null)
  const [pupilMm, setPupilMm] = useState(4.0)
  const [why, setWhy] = useState('resting')

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const reduce = prefersReducedMotion()
    let prog
    try { prog = program(gl, VERT, FRAG) } catch (err) { console.warn('WebGL drawing unavailable:', err.message); return }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = uniforms(gl, prog, ['uRes', 'uTime', 'uCenter', 'uSize', 'uLook', 'uPupil', 'uBlink', 'uOpen', 'uMouse'])

    const s = {
      mouse: [-9999, -9999], lastMove: 0, look: [0, 0], lookTarget: [0, 0], nextSaccade: 0,
      pupil: 0.38, pupilTarget: 0.38, attention: 0, blink: 0, blinkAt: 2.6 + Math.random() * 3, blinkStart: -1,
      open: reduce ? 1 : 0, born: -1, reportAt: 0,
    }
    const off = onAttention((v) => { s.attention = v })
    const move = (e) => {
      const r = canvas.getBoundingClientRect()
      const dpr = canvas.width / Math.max(1, r.width)
      s.mouse = [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr]
      s.lastMove = performance.now() / 1000
    }
    window.addEventListener('pointermove', move, { passive: true })

    const stop = loop(canvas, (time) => {
      fit(canvas, 1.25)
      const W = canvas.width, H = canvas.height
      gl.viewport(0, 0, W, H)
      if (s.born < 0) s.born = time
      const { cx, cy, size } = (placement || defaultPlacement)(W, H)

      // gaze: follow the cursor, or wander in small jumps when it rests
      const idle = time > 0 && performance.now() / 1000 - s.lastMove > 1.6
      if (!idle && s.mouse[0] > -9000) {
        const dx = (s.mouse[0] - cx) / (size * 2.6), dy = (s.mouse[1] - cy) / (size * 2.2)
        const len = Math.hypot(dx, dy)
        const k = len > 1 ? 1 / len : 1
        s.lookTarget = [dx * k, dy * k]
      } else if (time > s.nextSaccade) {
        s.lookTarget = [(Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7]
        s.nextSaccade = time + 0.7 + Math.random() * 2.2
      }
      const ease = idle ? 0.35 : 0.14
      s.look = [lerp(s.look[0], s.lookTarget[0], ease), lerp(s.look[1], s.lookTarget[1], ease)]

      // pupil: interest widens it; light close to the eye narrows it
      const near = s.mouse[0] > -9000 ? Math.hypot(s.mouse[0] - cx, s.mouse[1] - cy) / size : 9
      const light = clamp(1.25 - near, 0, 1)
      s.pupilTarget = clamp(0.38 + s.attention * 0.45 - light * 0.36, 0.05, 1)
      s.pupil = lerp(s.pupil, s.pupilTarget, 0.045)

      // blink every few seconds
      if (!reduce && time > s.blinkAt && s.blinkStart < 0) s.blinkStart = time
      if (s.blinkStart >= 0) {
        const bt = (time - s.blinkStart) / 0.32
        s.blink = bt < 0.42 ? bt / 0.42 : clamp(1 - (bt - 0.42) / 0.58, 0, 1)
        if (bt >= 1) { s.blinkStart = -1; s.blink = 0; s.blinkAt = time + 2.4 + Math.random() * 4.6 }
      }
      // the eye opens slowly when the page arrives
      const ot = clamp((time - s.born - 0.35) / 1.9, 0, 1)
      s.open = reduce ? 1 : 1 - Math.pow(1 - ot, 3)

      gl.uniform2f(u.uRes, W, H)
      gl.uniform1f(u.uTime, time)
      gl.uniform2f(u.uCenter, cx, cy)
      gl.uniform1f(u.uSize, size)
      gl.uniform2f(u.uLook, s.look[0], s.look[1])
      gl.uniform1f(u.uPupil, s.pupil)
      gl.uniform1f(u.uBlink, s.blink)
      gl.uniform1f(u.uOpen, s.open)
      gl.uniform2f(u.uMouse, s.mouse[0], s.mouse[1])
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (time > s.reportAt) {
        s.reportAt = time + 0.2
        setPupilMm(Math.round((2 + s.pupil * 5.4) * 10) / 10)
        setWhy(light > 0.25 ? 'light' : s.attention > 0.5 ? 'interest' : 'resting')
      }
    })

    return () => {
      stop()
      off()
      window.removeEventListener('pointermove', move)
    }
  }, [placement])

  return (
    <div className={`eye ${className}`}>
      <canvas ref={canvasRef} className="eye-canvas" aria-hidden="true" />
      <div className="eye-readout" aria-live="off">
        <span className="eye-readout-value">{pupilMm.toFixed(1)} mm</span>
        <span className="eye-readout-why">
          {why === 'light' ? 'Light close by: the pupil narrows' : why === 'interest' ? 'Interest: the pupil widens' : 'Pupil at rest'}
        </span>
      </div>
    </div>
  )
}

function defaultPlacement(W, H) {
  const wide = W / H > 1.1
  return wide
    ? { cx: W * 0.68, cy: H * 0.5, size: Math.min(W * 0.26, H * 0.4) }
    : { cx: W * 0.5, cy: H * 0.24, size: Math.min(W * 0.44, H * 0.2) }  // WebGL counts y from the bottom
}
