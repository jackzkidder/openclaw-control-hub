import { getDb, initDb } from '../index'
import { AppSettings, DEFAULT_SETTINGS } from '../../openclaw/types'

type Row = Record<string, unknown>

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] })
    if (!result.rows.length) return DEFAULT_SETTINGS[key]
    return JSON.parse(String((result.rows[0] as Row).value)) as AppSettings[K]
  } catch {
    return DEFAULT_SETTINGS[key]
  }
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  await initDb()
  const db = getDb()
  await db.execute({
    sql: `INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    args: [key, JSON.stringify(value)],
  })
}

export async function getAllSettings(): Promise<AppSettings> {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute('SELECT key, value FROM settings')
    const overrides: Partial<AppSettings> = {}
    for (const row of result.rows) {
      const r = row as Row
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(overrides as any)[String(r.key)] = JSON.parse(String(r.value))
      } catch { /* skip */ }
    }
    return { ...DEFAULT_SETTINGS, ...overrides }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function setAllSettings(settings: Partial<AppSettings>): Promise<void> {
  await initDb()
  const db = getDb()
  const stmts = Object.entries(settings).map(([key, value]) => ({
    sql: `INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    args: [key, JSON.stringify(value)],
  }))
  if (stmts.length) await db.batch(stmts, 'write')
}
