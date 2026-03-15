import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/index'

type Row = Record<string, unknown>

export async function GET() {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute(`
      SELECT id, type, agent_id, conversation_id, payload, received_at
      FROM event_log
      WHERE type IN ('agent.message', 'agent.tool_call', 'agent.tool_result')
      ORDER BY received_at DESC
      LIMIT 200
    `)

    const messages = (result.rows as Row[]).map((r) => {
      let payload: Record<string, unknown> = {}
      try { payload = JSON.parse(String(r.payload ?? '{}')) } catch { /**/ }
      return {
        id: String(r.id),
        type: String(r.type),
        agentId: r.agent_id != null ? String(r.agent_id) : null,
        conversationId: r.conversation_id != null ? String(r.conversation_id) : null,
        payload,
        timestamp: String(r.received_at),
      }
    })

    return NextResponse.json(messages)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
