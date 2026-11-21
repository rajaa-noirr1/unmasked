// Adds an admin who can sign in at /admin (or gives an existing admin a new password).
// Run: npm run admin:create   (asks for a username and a password; the password is shown as stars and
// only its scrypt hash is stored). It first makes sure the admin tables exist (db/admin.sql), so it
// works on a database built before the admin side existed, without a reset.
// To list admins:   npm run admin:create -- --list      To remove one:   npm run admin:create -- --remove <name>
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'
import pg from 'pg'
import { hashPassword, USERNAME, MIN_PASSWORD } from '../src/auth.js'

const here = dirname(fileURLToPath(import.meta.url))
if (!process.env.PGPASSWORD) throw new Error('server/.env needs PGPASSWORD (see .env.example)')

function ask(question, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? question : '*')
  return new Promise((done) => rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); done(answer) }))
}

const db = new pg.Client()
await db.connect()
await db.query(readFileSync(join(here, '..', 'db', 'admin.sql'), 'utf8'))

const args = process.argv.slice(2)
if (args[0] === '--list') {
  const { rows } = await db.query('SELECT username, created_at, last_login FROM admin.accounts ORDER BY id')
  console.log(rows.length ? rows.map((r) => `${r.username}  (added ${r.created_at.toISOString().slice(0, 10)}, last sign-in ${r.last_login ? r.last_login.toISOString().slice(0, 16).replace('T', ' ') : 'never'})`).join('\n') : 'No admins yet.')
} else if (args[0] === '--remove') {
  const { rowCount } = await db.query('DELETE FROM admin.accounts WHERE username = $1', [String(args[1] || '').toLowerCase()])
  console.log(rowCount ? `Removed ${args[1]}.` : `There is no admin called ${args[1]}.`)
} else {
  const username = (await ask('Admin username (3 to 32: a-z, 0-9, . _ -): ')).trim().toLowerCase()
  if (!USERNAME.test(username)) throw new Error('That username does not fit: 3 to 32 of a-z, 0-9, dot, underscore or dash.')
  const password = await ask(`Password (at least ${MIN_PASSWORD} characters): `, true)
  if (password.length < MIN_PASSWORD) throw new Error(`The password needs at least ${MIN_PASSWORD} characters.`)
  if ((await ask('The same password again: ', true)) !== password) throw new Error('The two passwords are not the same.')
  const { rows } = await db.query(
    `INSERT INTO admin.accounts (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING (xmax = 0) AS added`,
    [username, await hashPassword(password)])
  // a new password signs the old sessions out
  if (!rows[0].added) await db.query('DELETE FROM admin.sessions s USING admin.accounts a WHERE a.id = s.account_id AND a.username = $1', [username])
  console.log(rows[0].added ? `Admin "${username}" added. Sign in at /admin.` : `Admin "${username}" has a new password.`)
}
await db.end()
