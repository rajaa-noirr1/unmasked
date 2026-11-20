import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// npm run dev           → http://localhost:5180 (front end only for now; content lives in src/data/)
// npm run build         → the finished site for the laptop (npm run site serves it on 5181)
// npm run build:pages   → the GitHub Pages version, served from /unmasked/
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/unmasked/' : '/',
  // its own folder, so publishing never overwrites the laptop build that npm run site serves
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' },
  plugins: [react(), mode === 'pages' && githubPages()],
  // /api goes to the Unmasked API (server/, Express on PostgreSQL), in development and in npm run site
  server: { port: 5180, strictPort: true, proxy: { '/api': 'http://localhost:4100' } },
  preview: { port: 5181, strictPort: true, proxy: { '/api': 'http://localhost:4100' } },
}))

// GitHub Pages serves 404.html for any unknown address, so a copy of the app there makes links like
// /unmasked/mirror work on refresh. .nojekyll tells Pages to serve the files exactly as built.
function githubPages() {
  return {
    name: 'github-pages',
    closeBundle() {
      copyFileSync(resolve('dist-pages/index.html'), resolve('dist-pages/404.html'))
      writeFileSync(resolve('dist-pages/.nojekyll'), '')
    },
  }
}
