// Talking to the Unmasked API (server/, Express on PostgreSQL). On the laptop the website and the API
// run together and Vite passes /api through to the API. The GitHub Pages version has no API: there the
// site uses its built-in content and keeps rehearsals and scores in the browser, as before.
const ENABLED = import.meta.env.MODE !== 'pages'

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
