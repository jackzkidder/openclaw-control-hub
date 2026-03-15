import path from 'path'
import fs from 'fs'
import { createClient, type Client } from '@libsql/client'
import { migrations, SCHEMA_VERSION } from './schema'

// Production: use Turso remote DB via env vars
// Development: use local SQLite file
function getDbConfig(): { url: string; authToken?: string } {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }
  }

  const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(process.cwd(), 'data', 'mission-control.db')

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  return { url: `file:${DB_PATH.replace(/\\/g, '/')}` }
}

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined
  // eslint-disable-next-line no-var
  var __dbReady: boolean | undefined
}

function createDb(): Client {
  return createClient(getDbConfig())
}

export function getDb(): Client {
  if (process.env.NODE_ENV === 'development') {
    if (!global.__db) {
      global.__db = createDb()
      global.__dbReady = false
    }
    return global.__db
  }
  return createDb()
}

// Run migrations — call this once at startup
export async function initDb(): Promise<void> {
  if (process.env.NODE_ENV === 'development' && global.__dbReady) return

  const client = getDb()

  // Check current schema version
  let currentVersion = 0
  try {
    const result = await client.execute(
      `SELECT value FROM schema_meta WHERE key = 'version'`
    )
    if (result.rows.length > 0) {
      currentVersion = parseInt(String(result.rows[0].value ?? '0'), 10)
    }
  } catch {
    // schema_meta doesn't exist yet — version is 0
  }

  // Apply pending migrations
  for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
    const stmts = migrations[v]
    if (!stmts) continue
    for (const sql of stmts) {
      await client.execute(sql)
    }
    await client.execute({
      sql: `INSERT OR REPLACE INTO schema_meta(key, value) VALUES ('version', ?)`,
      args: [String(v)],
    })
  }

  if (process.env.NODE_ENV === 'development') {
    global.__dbReady = true
  }
}
