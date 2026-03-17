import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/index'

type Row = Record<string, unknown>

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const db = getDb()
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '30', 10)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const result = await db.execute({
      sql: `SELECT period_date, agent_id, model, input_tokens, output_tokens, cost_usd, recorded_at
            FROM usage_snapshots WHERE period_date >= ? ORDER BY period_date ASC, agent_id ASC`,
      args: [cutoffStr],
    })

    const rows = result.rows as Row[]
    const lines = [
      'date,agent_id,model,input_tokens,output_tokens,cost_usd',
      ...rows.map((r) =>
        [r.period_date, r.agent_id, r.model, r.input_tokens, r.output_tokens, Number(r.cost_usd).toFixed(6)].join(','),
      ),
    ]

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="openclaw-usage-${days}d.csv"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
