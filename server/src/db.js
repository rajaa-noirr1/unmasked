import pg from 'pg'

// Numbers come back as numbers (counts are bigint, levels are numeric).
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)))     // bigint
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)))   // numeric

// Connection settings come from server/.env (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).
export const pool = new pg.Pool({ max: 10 })
// If PostgreSQL restarts (or the database is rebuilt), idle connections drop. Log it and carry on:
// the pool opens fresh connections for the next request instead of crashing the API.
pool.on('error', (e) => console.warn('database connection dropped:', e.message))

export const q = (text, params) => pool.query(text, params)
export const rows = async (text, params) => (await pool.query(text, params)).rows
export const one = async (text, params) => (await pool.query(text, params)).rows[0] ?? null

// Runs fn(client) inside one transaction: all of it happens, or none of it.
export async function tx(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
