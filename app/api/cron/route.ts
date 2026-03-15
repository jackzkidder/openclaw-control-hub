import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/index'
import { nanoid } from 'nanoid'
import type { CronJob } from '@/lib/openclaw/types'

type Row = Record<string, unknown>

function rowToCronJob(row: Row): CronJob {
  return {
    id: String(row.id),
    name: String(row.name),
    expression: String(row.expression),
    description: String(row.description ?? ''),
    agentId: row.agent_id != null ? String(row.agent_id) : null,
    webhookUrl: row.webhook_url != null ? String(row.webhook_url) : null,
    isEnabled: Boolean(row.is_enabled),
    lastRunAt: row.last_run_at != null ? String(row.last_run_at) : null,
    lastRunStatus: row.last_run_status as 'success' | 'failure' | null,
    nextRunAt: row.next_run_at != null ? String(row.next_run_at) : null,
    createdAt: String(row.created_at),
  }
}

export async function GET() {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute('SELECT * FROM cron_jobs ORDER BY created_at DESC')
    return NextResponse.json((result.rows as Row[]).map(rowToCronJob))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const db = getDb()
    const body = await req.json()
    if (!body.name || !body.expression) {
      return NextResponse.json({ error: 'name and expression are required' }, { status: 400 })
    }
    const id = nanoid()
    await db.execute({
      sql: `INSERT INTO cron_jobs (id, name, expression, description, agent_id, webhook_url, is_enabled)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [id, body.name, body.expression, body.description ?? '', body.agentId ?? null, body.webhookUrl ?? null],
    })
    const row = await db.execute({ sql: 'SELECT * FROM cron_jobs WHERE id = ?', args: [id] })
    return NextResponse.json(rowToCronJob(row.rows[0] as Row), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
