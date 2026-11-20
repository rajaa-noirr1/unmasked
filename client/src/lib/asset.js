// A file in client/public, addressed from wherever the site is served:
// '/' on the laptop, '/unmasked/' on GitHub Pages (vite.config.js sets the base).
export const asset = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')

// the same base, in the form the router wants ('/' or '/unmasked')
export const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
