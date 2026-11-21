// Small helpers shared by the public routes (app.js) and the admin routes (admin.js).
export class BadRequest extends Error { constructor(msg) { super(msg); this.status = 400 } }
export class NotFound extends Error { constructor(msg = 'not found') { super(msg); this.status = 404 } }

export const int = (v, name, lo, hi) => {
  const n = Number(v)
  if (!Number.isInteger(n) || n < lo || n > hi) throw new BadRequest(`${name} must be a whole number from ${lo} to ${hi}`)
  return n
}

// an async route: errors go to the error handler instead of crashing the server
export const route = (fn) => (req, res, next) => fn(req, res, next).catch(next)
