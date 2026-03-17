import { NextRequest, NextResponse } from 'next/server'
import { updateTask, deleteTask } from '@/lib/db/queries/tasks'
import type { TaskStatus } from '@/lib/openclaw/types'

export async function POST(req: NextRequest) {
  try {
    const { action, ids, status } = await req.json() as {
      action: 'move' | 'delete'
      ids: string[]
      status?: TaskStatus
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }
    if (action === 'delete') {
      await Promise.all(ids.map((id) => deleteTask(id)))
      return NextResponse.json({ ok: true, count: ids.length })
    }
    if (action === 'move' && status) {
      await Promise.all(ids.map((id) => updateTask({ id, status })))
      return NextResponse.json({ ok: true, count: ids.length })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
