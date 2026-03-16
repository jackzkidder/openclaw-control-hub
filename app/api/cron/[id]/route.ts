import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/index'

type Row = Record<string, unknown>

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const db = getDb()
    const body = await req.json()

    const setClauses: string[] = []
    const args: import('@libsql/client').InValue[] = []

    if (body.isEnabled !== undefined) { setClauses.push('is_enabled = ?'); args.push(Number(body.isEnabled)) }
    if (body.name !== undefined) { setClauses.push('name = ?'); args.push(body.name) }
    if (body.expression !== undefined) { setClauses.push('expression = ?'); args.push(body.expression) }
    if (body.description !== undefined) { setClauses.push('description = ?'); args.push(body.description) }
    if (body.lastRunStatus !== undefined) { setClauses.push('last_run_status = ?'); args.push(body.lastRunStatus) }
    if (body.lastRunAt !== undefined) { setClauses.push('last_run_at = ?'); args.push(body.lastRunAt) }

    if (!setClauses.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    args.push(params.id)
    await db.execute({ sql: `UPDATE cron_jobs SET ${setClauses.join(', ')} WHERE id = ?`, args })

    const result = await db.execute({ sql: 'SELECT * FROM cron_jobs WHERE id = ?', args: [params.id] })
    if (!result.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const row = result.rows[0] as Row
    return NextResponse.json({
      id: String(row.id), name: String(row.name), expression: String(row.expression),
      description: String(row.description ?? ''),
      agentId: row.agent_id != null ? String(row.agent_id) : null,
      webhookUrl: row.webhook_url != null ? String(row.webhook_url) : null,
      isEnabled: Boolean(row.is_enabled),
      lastRunAt: row.last_run_at != null ? String(row.last_run_at) : null,
      lastRunStatus: row.last_run_status,
      nextRunAt: row.next_run_at != null ? String(row.next_run_at) : null,
      createdAt: String(row.created_at),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute({ sql: 'DELETE FROM cron_jobs WHERE id = ?', args: [params.id] })
    if ((result.rowsAffected ?? 0) === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
