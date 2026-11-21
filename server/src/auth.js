// Admin sign-in: passwords hashed with scrypt, sessions as random tokens in an HttpOnly cookie.
// The database keeps only the SHA-256 of each token (admin.sessions), never the token itself.
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { one, q } from './db.js'

const scryptAsync = promisify(scrypt)
const N = 16384, R = 8, P = 1, KEYLEN = 64
export const COOKIE = 'unmasked_admin'
export const SESSION_HOURS = 8

// 'scrypt$16384$8$1$<salt>$<hash>', both in base64
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P })
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$')
}

export async function checkPassword(password, stored) {
  const [kind, n, r, p, salt, hash] = String(stored).split('$')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const want = Buffer.from(hash, 'base64')
  const got = await scryptAsync(password, Buffer.from(salt, 'base64'), want.length, { N: +n, r: +r, p: +p })
  return got.length === want.length && timingSafeEqual(got, want)
}

// The same rules for a new account (admin-create) and a sign-in.
export const USERNAME = /^[a-z0-9._-]{3,32}$/
export const MIN_PASSWORD = 10

const sha = (token) => createHash('sha256').update(token).digest()

export async function startSession(accountId) {
  const token = randomBytes(32).toString('base64url')
  await q(`INSERT INTO admin.sessions (token_hash, account_id, expires_at) VALUES ($1, $2, now() + make_interval(hours => $3))`,
    [sha(token), accountId, SESSION_HOURS])
  await q('UPDATE admin.accounts SET last_login = now() WHERE id = $1', [accountId])
  // old sessions are cleared on the way
  await q('DELETE FROM admin.sessions WHERE expires_at < now()')
  return token
}

export const endSession = (token) => q('DELETE FROM admin.sessions WHERE token_hash = $1', [sha(token)])

export function readCookie(req, name = COOKIE) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return null
}

export function setCookie(res, req, token) {
  const secure = req.secure ? '; Secure' : ''
  const life = token ? `Max-Age=${SESSION_HOURS * 3600}` : 'Max-Age=0'
  res.setHeader('Set-Cookie', `${COOKIE}=${token ? encodeURIComponent(token) : ''}; Path=/api; HttpOnly; SameSite=Strict; ${life}${secure}`)
}

// Who is signed in on this request, or null.
export async function currentAdmin(req) {
  const token = readCookie(req)
  if (!token || token.length > 100) return null
  return one(`SELECT a.id, a.username FROM admin.sessions s JOIN admin.accounts a ON a.id = s.account_id
              WHERE s.token_hash = $1 AND s.expires_at > now()`, [sha(token)])
}

// Too many wrong passwords from one address: wait. Five tries, then five minutes.
const fails = new Map()
export function tooManyTries(ip) {
  const f = fails.get(ip)
  return f && f.n >= 5 && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0
}
export function failedTry(ip) {
  const f = fails.get(ip)
  const fresh = !f || f.until < Date.now()
  fails.set(ip, { n: fresh ? 1 : f.n + 1, until: Date.now() + 5 * 60 * 1000 })
}
export const goodTry = (ip) => fails.delete(ip)
