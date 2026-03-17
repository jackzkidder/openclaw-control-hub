import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { CronRunHistory } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToRun(row: Row): CronRunHistory {
  return {
    id: String(row.id),
    cronJobId: String(row.cron_job_id),
    status: row.status as CronRunHistory['status'],
    startedAt: String(row.started_at),
    finishedAt: row.finished_at != null ? String(row.finished_at) : null,
    output: row.output != null ? String(row.output) : null,
    error: row.error != null ? String(row.error) : null,
  }
}

export async function getCronHistory(cronJobId: string, limit = 20): Promise<CronRunHistory[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM cron_run_history WHERE cron_job_id = ? ORDER BY started_at DESC LIMIT ?',
    args: [cronJobId, limit],
  })
  return (result.rows as Row[]).map(rowToRun)
}

export async function logCronRun(
  cronJobId: string,
  status: 'success' | 'failure',
  output?: string,
  error?: string,
): Promise<CronRunHistory> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  const now = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO cron_run_history (id, cron_job_id, status, started_at, finished_at, output, error)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, cronJobId, status, now, now, output ?? null, error ?? null],
  })
  const result = await db.execute({ sql: 'SELECT * FROM cron_run_history WHERE id = ?', args: [id] })
  return rowToRun(result.rows[0] as Row)
}
