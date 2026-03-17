import { NextRequest, NextResponse } from 'next/server'
import { getTaskHistory } from '@/lib/db/queries/taskHistory'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })
  try {
    const history = await getTaskHistory(taskId)
    return NextResponse.json(history)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
