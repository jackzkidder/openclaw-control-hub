import { NextRequest, NextResponse } from 'next/server'
import { updateTask, deleteTask } from '@/lib/db/queries/tasks'
import type { UpdateTaskInput } from '@/lib/openclaw/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as Omit<UpdateTaskInput, 'id'>
    const task = await updateTask({ ...body, id: params.id })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteTask(params.id)
    if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
