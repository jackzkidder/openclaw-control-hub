import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks } from '@/lib/db/queries/tasks'
import { getAllDocuments } from '@/lib/db/queries/documents'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase().trim()
  if (!q || q.length < 2) return NextResponse.json({ tasks: [], documents: [] })
  try {
    const [tasks, documents] = await Promise.all([getAllTasks(), getAllDocuments()])
    const matchedTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (t.assignedAgentId?.toLowerCase().includes(q) ?? false),
    )
    const matchedDocs = documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.summary?.toLowerCase().includes(q) ?? false),
    )
    return NextResponse.json({ tasks: matchedTasks.slice(0, 10), documents: matchedDocs.slice(0, 5) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
