import { NextRequest, NextResponse } from 'next/server'
import { getDocumentById, updateDocumentStatus, deleteDocument } from '@/lib/db/queries/documents'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await getDocumentById(params.id)
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(doc)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const doc = await updateDocumentStatus(params.id, body.status, {
      chunkCount: body.chunkCount,
      summary: body.summary,
      errorMessage: body.errorMessage,
      processedAt: body.processedAt,
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(doc)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteDocument(params.id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
