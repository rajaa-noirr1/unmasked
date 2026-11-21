// Talking to the Unmasked API (server/, Express on PostgreSQL). On the laptop the website and the API
// run together and Vite passes /api through to the API. The GitHub Pages version has no API: there the
// site uses its built-in content and keeps rehearsals and scores in the browser, as before.
export const ENABLED = import.meta.env.MODE !== 'pages'

async function call(method, path, body) {
  if (!ENABLED) return null
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      console.warn(`API ${method} ${path}: ${res.status}`, await res.json().catch(() => ({})))
      return null
    }
    return await res.json()
  } catch {
    return null   // no API running: the caller falls back
  }
}

// A random id for this browser, so a visitor's rehearsals and tests can be told apart. No name, no account.
export function visitorId() {
  try {
    let id = localStorage.getItem('unmasked:visitor')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('unmasked:visitor', id)
    }
    return id
  } catch {
    return null
  }
}

export const api = {
  content: () => call('GET', '/content'),
  saveRehearsal: (report) => {
    const visitor = visitorId()
    return visitor ? call('POST', '/rehearsals', { ...report, visitor }) : Promise.resolve(null)
  },
  startAttempt: (test, lang) => {
    const visitor = visitorId()
    return visitor ? call('POST', '/attempts', { visitor, test, lang }) : Promise.resolve(null)
  },
  answer: (attemptId, question, option) => call('POST', `/attempts/${attemptId}/answers`, { question, option }),
}

// ── the admin side (pages/Admin.jsx) ──
// Unlike the calls above, these say what went wrong: the admin page shows the server's reason.
// The sign-in lives in an HttpOnly cookie the browser sends by itself; this code never sees it.
export class AdminError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function adminCall(method, path, body, type) {
  if (!ENABLED) throw new AdminError('The admin side needs the local server.', 0)
  let res
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': type || 'application/json' } : undefined,
      body: body === undefined ? undefined : type ? body : JSON.stringify(body),
    })
  } catch {
    throw new AdminError('The API is not answering. Is it running (npm run dev)?', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AdminError(data.error || `Something went wrong (${res.status}).`, res.status)
  return data
}

export const admin = {
  me: () => adminCall('GET', '/me'),
  login: (username, password) => adminCall('POST', '/login', { username, password }),
  logout: () => adminCall('POST', '/logout', {}),
  get: (path) => adminCall('GET', path),
  add: (what, body) => adminCall('POST', `/${what}`, body),
  save: (what, id, body) => adminCall('PUT', `/${what}/${id}`, body),
  remove: (what, id) => adminCall('DELETE', `/${what}/${id}`),
  move: (what, id, by) => adminCall('POST', `/${what}/${id}/move`, { by }),
  photo: (file) => adminCall('POST', '/photos', file, file.type),
}
