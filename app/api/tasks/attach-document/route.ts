import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/index'
import { attachDocumentToTask } from '@/lib/db/queries/documents'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const body = await req.json()
    const { documentId, taskId } = body as { documentId?: string; taskId?: string }
    if (!documentId || !taskId) {
      return NextResponse.json({ error: 'documentId and taskId are required' }, { status: 400 })
    }
    const doc = await attachDocumentToTask(documentId, taskId)
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    return NextResponse.json(doc)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
