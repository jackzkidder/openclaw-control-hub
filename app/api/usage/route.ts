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
      sql: `SELECT period_date as date, agent_id as agentId, model,
                   input_tokens as inputTokens, output_tokens as outputTokens, cost_usd as costUsd
            FROM usage_snapshots
            WHERE period_date >= ?
            ORDER BY period_date ASC`,
      args: [cutoffStr],
    })

    const rows = (result.rows as Row[]).map((r) => ({
      date: String(r.date),
      agentId: String(r.agentId),
      model: String(r.model),
      inputTokens: Number(r.inputTokens),
      outputTokens: Number(r.outputTokens),
      costUsd: Number(r.costUsd),
    }))

    const totalInputTokens = rows.reduce((s, r) => s + r.inputTokens, 0)
    const totalOutputTokens = rows.reduce((s, r) => s + r.outputTokens, 0)
    const totalCostUsd = rows.reduce((s, r) => s + r.costUsd, 0)

    const byAgent: Record<string, { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; totalCost: number }> = {}
    for (const r of rows) {
      if (!byAgent[r.agentId]) byAgent[r.agentId] = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalCost: 0 }
      byAgent[r.agentId].inputTokens += r.inputTokens
      byAgent[r.agentId].outputTokens += r.outputTokens
      byAgent[r.agentId].totalCost += r.costUsd
    }

    const byDate: Record<string, { date: string; agentId: string; model: string; inputTokens: number; outputTokens: number; costUsd: number }> = {}
    for (const r of rows) {
      if (!byDate[r.date]) byDate[r.date] = { date: r.date, agentId: 'all', model: 'all', inputTokens: 0, outputTokens: 0, costUsd: 0 }
      byDate[r.date].inputTokens += r.inputTokens
      byDate[r.date].outputTokens += r.outputTokens
      byDate[r.date].costUsd += r.costUsd
    }

    return NextResponse.json({ totalInputTokens, totalOutputTokens, totalCostUsd, byAgent, byModel: {}, dailyTrend: Object.values(byDate) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
