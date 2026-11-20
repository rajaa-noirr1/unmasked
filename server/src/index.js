// Starts the Unmasked API (the routes are in app.js). Port from server/.env (API_PORT), 4100 by default.
import { app } from './app.js'
import { pool } from './db.js'

const port = Number(process.env.API_PORT) || 4100
const server = app.listen(port, () => console.log(`Unmasked API on http://localhost:${port}`))
const stop = () => server.close(() => pool.end().then(() => process.exit(0)))
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
