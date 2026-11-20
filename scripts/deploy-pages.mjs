// Publishes the website to GitHub Pages: builds client/ in "pages" mode (served from /unmasked/), then
// pushes client/dist-pages to the gh-pages branch, which GitHub Pages serves.
// Run from the Why folder: npm run deploy:pages
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'client', 'dist-pages')
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' })

const remote = execSync('git remote get-url origin', { cwd: root }).toString().trim()
const commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()

run('npm --prefix client run build:pages')
rmSync(join(dist, '.git'), { recursive: true, force: true })
run('git init -q -b gh-pages', dist)
run('git add -A', dist)
run(`git commit -q -m "Publish Unmasked (from ${commit})"`, dist)
run(`git push -q -f ${remote} gh-pages`, dist)
rmSync(join(dist, '.git'), { recursive: true, force: true })
console.log('Published. GitHub Pages updates within a minute or two.')
