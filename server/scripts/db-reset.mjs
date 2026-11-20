// Builds the Unmasked database from scratch: the website's own database user, the database, the schema
// and the seed. Run: npm run db:reset   (reads server/.env; everything in the unmasked database is replaced,
// including visitors' rehearsals and test answers)
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const { PGHOST = 'localhost', PGPORT = '5432', PGDATABASE = 'unmasked', PGUSER = 'unmasked_app', PGPASSWORD } = process.env
if (!PGPASSWORD) throw new Error('server/.env needs PGPASSWORD (see .env.example)')

// The superuser password: from server/.env if it is there, otherwise typed here (shown as stars, not saved).
function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? question : '*')
  return new Promise((done) => rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); done(answer) }))
}
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || await askHidden('PostgreSQL superuser (postgres) password: ')
const ident = (s) => `"${s.replace(/"/g, '""')}"`
const literal = (s) => `'${s.replace(/'/g, "''")}'`

// 1. As the database superuser: the website's own user, and a fresh database it owns.
const admin = new pg.Client({ host: PGHOST, port: +PGPORT, user: 'postgres', password: POSTGRES_PASSWORD, database: 'postgres' })
await admin.connect()
const exists = (await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [PGUSER])).rowCount > 0
await admin.query(`${exists ? 'ALTER' : 'CREATE'} ROLE ${ident(PGUSER)} WITH LOGIN PASSWORD ${literal(PGPASSWORD)}`)
await admin.query(`DROP DATABASE IF EXISTS ${ident(PGDATABASE)} WITH (FORCE)`)
await admin.query(`CREATE DATABASE ${ident(PGDATABASE)} OWNER ${ident(PGUSER)} ENCODING 'UTF8' TEMPLATE template0`)
await admin.end()
console.log(`database "${PGDATABASE}" created, owned by "${PGUSER}"`)

// 2. As the website's user: the schema, then the seed, each in one transaction.
const db = new pg.Client({ host: PGHOST, port: +PGPORT, user: PGUSER, password: PGPASSWORD, database: PGDATABASE })
await db.connect()
await db.query('SET search_path = public')
for (const file of ['schema.sql', 'seed.sql']) {
  const sql = readFileSync(join(here, '..', 'db', file), 'utf8')
  await db.query('BEGIN')
  try { await db.query(sql); await db.query('COMMIT') } catch (e) { await db.query('ROLLBACK'); throw new Error(`${file}: ${e.message}`) }
  console.log(`ran ${file}`)
}
const counts = await db.query('SELECT * FROM content_counts')
const tables = await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
console.log(`${tables.rows[0].n} tables; rows:`, counts.rows[0])
await db.end()
