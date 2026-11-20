// Starts the API (server/, port 4100) and the website (client/) together. Ctrl+C stops both.
//   node scripts/run.mjs dev            editing: http://localhost:5180, both restart on changes
//   node scripts/run.mjs site [--open]  the finished site: builds it, then serves it at http://localhost:5181
import { spawn, execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mode = process.argv[2] === 'site' ? 'site' : 'dev'
const open = process.argv.includes('--open')
const kids = []

if (mode === 'site') execSync('npm --prefix client run build', { cwd: root, stdio: 'inherit' })

function run(name, dir, command, color) {
  // one command string through the shell: npm is a .cmd script on Windows
  const child = spawn(command, { cwd: join(root, dir), shell: true, env: process.env })
  const tag = `\x1b[${color}m[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    let rest = ''
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split(/\r?\n/)
      rest = lines.pop()
      for (const l of lines) if (l.trim()) out.write(tag + l + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => { console.log(`${tag}stopped (${code ?? 'signal'})`); stop() })
  kids.push(child)
}

let stopping = false
function stop() {
  if (stopping) return
  stopping = true
  for (const k of kids) {
    if (k.exitCode !== null) continue
    if (process.platform === 'win32') { try { execSync(`taskkill /pid ${k.pid} /T /F`, { stdio: 'ignore' }) } catch {} }
    else k.kill('SIGINT')
  }
  setTimeout(() => process.exit(0), 300)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

run('api', 'server', mode === 'dev' ? 'npm run dev' : 'npm start', '33')
run('web', 'client', mode === 'dev' ? 'npm run dev' : `npm run preview${open ? ' -- --open' : ''}`, '36')
