import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks, createTask } from '@/lib/db/queries/tasks'
import type { CreateTaskInput } from '@/lib/openclaw/types'

export async function GET() {
  try {
    const tasks = await getAllTasks()
    return NextResponse.json(tasks)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateTaskInput
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const task = await createTask(body)
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
