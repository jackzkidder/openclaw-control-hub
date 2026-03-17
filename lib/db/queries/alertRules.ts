import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { AlertRule } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToRule(row: Row): AlertRule {
  return {
    id: String(row.id),
    name: String(row.name),
    metric: row.metric as AlertRule['metric'],
    threshold: Number(row.threshold),
    enabled: Boolean(row.enabled),
    createdAt: String(row.created_at),
  }
}

export async function getAlertRules(): Promise<AlertRule[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT * FROM alert_rules ORDER BY created_at ASC')
  return (result.rows as Row[]).map(rowToRule)
}

export async function createAlertRule(
  name: string,
  metric: AlertRule['metric'],
  threshold: number,
): Promise<AlertRule> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  await db.execute({
    sql: 'INSERT INTO alert_rules (id, name, metric, threshold) VALUES (?, ?, ?, ?)',
    args: [id, name, metric, threshold],
  })
  const result = await db.execute({ sql: 'SELECT * FROM alert_rules WHERE id = ?', args: [id] })
  return rowToRule(result.rows[0] as Row)
}

export async function updateAlertRule(id: string, updates: { name?: string; threshold?: number; enabled?: boolean }): Promise<AlertRule | null> {
  await initDb()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM alert_rules WHERE id = ?', args: [id] })
  if (!result.rows.length) return null
  const existing = rowToRule(result.rows[0] as Row)
  await db.execute({
    sql: 'UPDATE alert_rules SET name = ?, threshold = ?, enabled = ? WHERE id = ?',
    args: [
      updates.name ?? existing.name,
      updates.threshold ?? existing.threshold,
      updates.enabled !== undefined ? Number(updates.enabled) : Number(existing.enabled),
      id,
    ],
  })
  const updated = await db.execute({ sql: 'SELECT * FROM alert_rules WHERE id = ?', args: [id] })
  return rowToRule(updated.rows[0] as Row)
}

export async function deleteAlertRule(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM alert_rules WHERE id = ?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}
