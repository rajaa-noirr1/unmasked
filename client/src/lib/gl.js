// Tiny WebGL helpers for the shaders written for Unmasked (the eye, the particle body).
// The React Bits effects bring their own code.

export function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s)
    gl.deleteShader(s)
    throw new Error('Shader failed to compile: ' + log)
  }
  return s
}

export function program(gl, vert, frag) {
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program failed to link: ' + gl.getProgramInfoLog(p))
  return p
}

export function uniforms(gl, p, names) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]))
}

// Resizes a canvas to its CSS size × device pixel ratio (capped). Returns true when the size changed.
export function fit(canvas, maxDpr = 1.5) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    return true
  }
  return false
}

// Runs fn(time) every frame while the element is on screen and the tab is visible.
export function loop(el, fn) {
  let raf = 0
  let visible = true
  let running = false
  const start = performance.now()
  const tick = (now) => {
    raf = 0
    if (!visible || document.hidden) { running = false; return }
    fn((now - start) / 1000)
    raf = requestAnimationFrame(tick)
  }
  const wake = () => { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(tick) } }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake() }, { rootMargin: '120px' })
  io.observe(el)
  document.addEventListener('visibilitychange', wake)
  wake()
  return () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    document.removeEventListener('visibilitychange', wake)
  }
}

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
